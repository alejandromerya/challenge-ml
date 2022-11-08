import { PlanetWeatherRepository } from '../infrastructure/adapter/planetWeatherRepository';
import {
  PredictGalaxyDaysWeatherUseCaseInput,
  PredictGalaxyDaysWeatherUseCaseOutput
} from './domain/ports/useCases';
import {
  Coordinates,
  DayWeather,
  MaxRainIntensityDays,
  Periods,
  Planet,
  Weather
} from './entities';

class PredictGalaxyDaysWeatherUseCase {
  constructor(private planetWeatherRepo: PlanetWeatherRepository) {}

  private validations(data: PredictGalaxyDaysWeatherUseCaseInput): void {
    //validations taking on count that this will be compiled to JS.
    if (!data.days) {
      throw new Error('Days to predict variable not found on input.');
    }

    if (!data.sunCoordinates) {
      throw new Error('Sun coordinates variable not found on input.');
    }

    if (!data.planets) {
      throw new Error('Planets info not found on input.');
    }

    if (data.planets.length !== 3) {
      throw new Error(
        `Planets length validation error, expected: 3, received: ${data.planets.length} .`
      );
    }

    data.planets.forEach((planet) => {
      if (
        !(
          planet.angularVelocity !== undefined &&
          planet.angularVelocity !== null
        ) ||
        !(planet.isClockwise !== undefined && planet.isClockwise !== null) ||
        !(planet.name !== undefined && planet.name !== null) ||
        !(planet.solarRadius !== undefined && planet.solarRadius !== null)
      ) {
        throw new Error('Missing basic planet info.');
      }
    });
  }

  private getLineEquation(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): ({ x, y }: Coordinates) => boolean {
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;

    return ({ x, y }: Coordinates) => {
      return y == m * x + b;
    };
  }

  private checkLinearPoints({
    planets,
    sun
  }: {
    planets: Coordinates[];
    sun: Coordinates;
  }): 'PLANETS_NOT_LINEAR' | 'GALAXY_LINEAR' | 'PLANETS_LINEAR' {
    const linearEquation = this.getLineEquation(
      planets[0].x,
      planets[0].y,
      planets[1].x,
      planets[1].y
    );

    let linearPlanets = true;

    for (const planet of planets) {
      if (!linearEquation(planet)) {
        linearPlanets = false;
        break;
      }
    }

    if (!linearPlanets) {
      return 'PLANETS_NOT_LINEAR';
    }

    const sunLinear = linearEquation(sun);

    return sunLinear ? 'GALAXY_LINEAR' : 'PLANETS_LINEAR';
  }

  private getCounterClockwisePosition(
    day: number,
    angularVelocity: number
  ): number {
    const position = (angularVelocity * day) % 360;

    return position === 0 ? 0 : position < 0 ? 360 : 360 - position;
  }

  private getClockwisePosition(day: number, angularVelocity: number): number {
    return (angularVelocity * day) % 360;
  }

  private getPlanetCoordinatesOnDay(
    angularVelocity: number,
    day: number,
    clockwise: boolean,
    solarRadius: number
  ): Coordinates {
    const position = clockwise
      ? this.getClockwisePosition(day, angularVelocity)
      : this.getCounterClockwisePosition(day, angularVelocity);

    const x = solarRadius * Math.cos((position * Math.PI) / 180);

    const y = solarRadius * Math.sin((position * Math.PI) / 180);

    return { x, y };
  }

  private triangleArea(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ): number {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
  }

  private trianglePerimeter(
    a: Coordinates,
    b: Coordinates,
    c: Coordinates
  ): number {
    const ab = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    const bc = Math.sqrt(Math.pow(c.x - b.x, 2) + Math.pow(c.y - b.y, 2));
    const ca = Math.sqrt(Math.pow(a.x - c.x, 2) + Math.pow(a.y - c.y, 2));

    return ab + bc + ca;
  }

  private checkSunInsidePlanetsTriangle({
    planets,
    sun
  }: {
    planets: [Coordinates, Coordinates, Coordinates];
    sun: Coordinates;
  }): boolean {
    // areas version.
    const [planetA, planetB, planetC] = planets;

    const areaABC = this.triangleArea(
      planetA.x,
      planetA.y,
      planetB.x,
      planetB.y,
      planetC.x,
      planetC.y
    );

    const areaSBC = this.triangleArea(
      sun.x,
      sun.y,
      planetB.x,
      planetB.y,
      planetC.x,
      planetC.y
    );

    const areaASC = this.triangleArea(
      planetA.x,
      planetA.y,
      sun.x,
      sun.y,
      planetC.x,
      planetC.y
    );

    const areaABS = this.triangleArea(
      planetA.x,
      planetA.y,
      planetB.x,
      planetB.y,
      sun.x,
      sun.y
    );

    return areaABC == areaSBC + areaASC + areaABS;

    //vectorial projections
    //   const side1 =
    //     (sun.x - planetB.x) * (planetA.y - planetB.y) -
    //     (planetA.x - planetB.x) * (sun.y - planetB.y); 1

    //   const side2 =
    //     (sun.x - planetC.x) * (planetB.y - planetC.y) -
    //     (planetB.x - planetC.x) * (sun.y - planetC.y); -1

    //   const side3 =
    //     (sun.x - planetA.x) * (planetC.y - planetA.y) -
    //     (planetC.x - planetA.x) * (sun.y - planetA.y); 2

    //   return (
    //     (side1 < 0.0 && side2 < 0.0 && side3 < 0.0) ||
    //     (side1 >= 0.0 && side2 >= 0.0 && side3 >= 0.0)
    //   );
  }

  private checkPerimeter(
    maxPerimetersDays: MaxRainIntensityDays,
    newPerimeter: { perimeter: number; day: number }
  ): MaxRainIntensityDays {
    if (!maxPerimetersDays.days.length) {
      maxPerimetersDays.days = [newPerimeter.day];
      maxPerimetersDays.perimeter = newPerimeter.perimeter;
    } else {
      if (maxPerimetersDays.perimeter === newPerimeter.perimeter) {
        maxPerimetersDays.days.push(newPerimeter.day);
      } else {
        if (maxPerimetersDays.perimeter < newPerimeter.perimeter) {
          maxPerimetersDays.days = [newPerimeter.day];
          maxPerimetersDays.perimeter = newPerimeter.perimeter;
        }
      }
    }
    return maxPerimetersDays;
  }

  private extraWeatherCalculations(
    planetA: Coordinates,
    planetB: Coordinates,
    planetC: Coordinates,
    sun: Coordinates
  ): { weather: Weather; perimeter: number | null } {
    const sunInsidePlanetsTriangle = this.checkSunInsidePlanetsTriangle({
      planets: [planetA, planetB, planetC],
      sun
    });

    if (sunInsidePlanetsTriangle) {
      // only calculate perimeter if sun inside triangle because sun outside does not ensure its
      // rainy season and therefor we do not need to know if perimeter is max of a no rainy season.
      const perimeter = this.trianglePerimeter(planetA, planetB, planetC);

      return {
        weather: 'rainy',
        perimeter
      };
    }

    return {
      weather: 'unknown',
      perimeter: null
    };
  }

  async execute(
    data: PredictGalaxyDaysWeatherUseCaseInput
  ): Promise<PredictGalaxyDaysWeatherUseCaseOutput> {
    this.validations(data);

    let maxRainyIntensityDays: MaxRainIntensityDays = {
      days: [],
      perimeter: 0
    };

    const periods: Periods = {
      drought: 0,
      rainy: 0,
      optimal: 0,
      unknown: 0
    };

    for (let i = 1; i < data.days; i++) {
      const dayWeather: DayWeather = {
        day: i,
        planets: [],
        weather: 'unknown'
      };

      const planetsWithCoordinates: Coordinates[] = [];

      data.planets.forEach((planet) => {
        const coordinates = this.getPlanetCoordinatesOnDay(
          planet.angularVelocity,
          i,
          planet.isClockwise,
          planet.solarRadius
        );

        dayWeather.planets.push({
          name: planet.name,
          coordinates: coordinates
        });

        planetsWithCoordinates.push(coordinates);
      });

      const planetsLineation = this.checkLinearPoints({
        planets: planetsWithCoordinates,
        sun: data.sunCoordinates
      });

      switch (planetsLineation) {
        case 'PLANETS_NOT_LINEAR':
          const extraWeatherData = this.extraWeatherCalculations(
            planetsWithCoordinates[0],
            planetsWithCoordinates[1],
            planetsWithCoordinates[2],
            data.sunCoordinates
          );

          if (extraWeatherData.perimeter) {
            maxRainyIntensityDays = this.checkPerimeter(maxRainyIntensityDays, {
              perimeter: extraWeatherData.perimeter,
              day: i
            });
          }
          dayWeather.weather = extraWeatherData.weather;
          break;
        case 'PLANETS_LINEAR':
          dayWeather.weather = 'optimal';
          break;
        case 'GALAXY_LINEAR':
          dayWeather.weather = 'drought';
          break;
        default:
          break;
      }

      periods[dayWeather.weather] += 1;

      //await this.planetWeatherRepo.createPlanetWeatherDay(dayWeather);
    }

    return {
      periods,
      maxRainyIntensityDays
    };
  }
}

export default PredictGalaxyDaysWeatherUseCase;
