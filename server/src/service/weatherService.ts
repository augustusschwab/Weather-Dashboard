import dotenv from 'dotenv';
dotenv.config();

// TODO: Define an interface for the Coordinates object
interface Coordinates{
  lon: number;
  lat: number
}

// TODO: Define a class for the Weather object
class Weather{
  date: string;
  tempF: number;
  windSpeed: number;
  humidity: number;
  icon: string;
  description: string;
  city: string;

  constructor(date: string, tempF:number, windSpeed: number, humidity: number, icon: string, description: string, city: string = ''){
    this.date = date;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
    this.icon = icon
    this.description = description;
    this.city = city;
  }
}

// TODO: Complete the WeatherService class
class WeatherService {
  // TODO: Define the baseURL, API key, and city name properties
  baseURL?: string;
  apiKey?: string;

  //Constructor for class, access environment variables storerd in .env file.
  constructor(){
    this.baseURL = process.env.API_BASE_URL || '';
    this.apiKey = process.env.API_KEY || '';
  }

  // TODO: Create fetchLocationData method. Takes in a string argument as a query to fetch the location.
  private async fetchLocationData(query: string) {
    try{
      const response = await fetch(query);
      return await response.json();

    } catch (err) {
      console.log('Error', err);
      return err;
    }
  }

  // TODO: Create destructureLocationData method. Pulls the longitude and latitude coordinates from the data the api responds with.
  private destructureLocationData(locationData: any): Coordinates {
    const coordinates: Coordinates = {
      lon: locationData.lon,
      lat: locationData.lat
    }
    return coordinates;
  }

  // TODO: Create buildGeocodeQuery method
  private buildGeocodeQuery(cityName:string): string {
    let cityNoSpace:string = cityName.replace(/ /g, "_");
    const query:string = `${this.baseURL}/geo/1.0/direct?q=${cityNoSpace}&limit=1&appid=${this.apiKey}`;
    return query;
  }
  
  // TODO: Create fetchAndDestructureLocationData method.
  private async fetchAndDestructureLocationData(cityName:string){
    try{
      //Calls fetchLocationData function and awaits response from the API.
      const response = await this.fetchLocationData(this.buildGeocodeQuery(cityName));

      //Returns coordinates, deconstructed from the data recieved from the API.
      return this.destructureLocationData(response[0]);

    } catch (err) {
      console.log('Error', err);
      return err;
    }
  }
  
  // TODO: Create buildWeatherQuery method
  private buildWeatherQuery(coordinates: Coordinates): string [] {
    const queryForcast:string = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
    const queryCurrent:string = `${this.baseURL}/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
    const weatherQueryArray:string [] = [queryCurrent, queryForcast];
    return weatherQueryArray;
  }

  // TODO: Create fetchWeatherData method
  private async fetchWeatherData(query:string []) {
    try{
      const responseCurrent = await fetch(query[0]);
      const responseForcast = await fetch(query[1]);
      
      const current = await responseCurrent.json();
      const forcast = await responseForcast.json();

      const currentWeather: Weather = this.parseCurrentWeather(current);
      const weatherForcast: Weather [] = this.buildForecastArray(currentWeather, forcast.list);
      
      return weatherForcast

    } catch(err) {
      console.log('Error, err');
      return err;
    }
  }
  
  //TODO: Build parseCurrentWeather method
  private parseCurrentWeather(currentWeather: any): Weather {
    const { weather, main, wind, dt, name } = currentWeather;
    const date = new Date (dt * 1000);
    const formattedDate:string = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    currentWeather = new Weather(formattedDate, main.temp, wind.speed, main.humidity, weather[0].icon, weather[0].description, name)
    return currentWeather;
  }
  
  // TODO: Complete buildForecastArray method
  private buildForecastArray(currentWeather: Weather, weatherData: any): Weather[] {
    const forecastByDay: Record<string, any[]> = {};
    const forecastArray: Weather [] = [];
    //Add current weather as first index of the forcast array.
    forecastArray.push(currentWeather);
    
    //Add the 5 day weather forcast to the forcast array
    const today = new Date().getDate();
    weatherData.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const day = date.getDate();
      const hour = date.getHours();

      if(day !== today){
        if(!forecastByDay[day]){
          forecastByDay[day] = [];
        }
        forecastByDay[day].push({...item, hour}) 
      }
    });

    const dailyWeather: any[] = Object.values(forecastByDay)
        .map((dayForecasts) =>
            dayForecasts.reduce((closest, current) =>
                Math.abs(current.hour! - 12) < Math.abs(closest.hour! - 12) ? current : closest
            )
      )
    
    dailyWeather.forEach((forecast: any) => {
      const date = new Date(forecast.dt * 1000);
      const formattedDate:string = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
      const weather = new Weather(formattedDate, forecast.main.temp, forecast.wind.speed, forecast.main.humidity, forecast.weather[0].icon, forecast.weather[0].description)
      forecastArray.push(weather)
    })

    return forecastArray;
  }
  
  // TODO: Complete getWeatherForCity method
  async getWeatherForCity(city: string) {
    try{
      const location: any =  await this.fetchAndDestructureLocationData(city);
      const coordinates: Coordinates = {lon: location.lon, lat: location.lat};
      const weatherForcast = await this.fetchWeatherData(this.buildWeatherQuery(coordinates));
      return weatherForcast;
      
    } catch(err) {
      console.log('Error, err');
      return err;
    }
  }
}

export default new WeatherService();
