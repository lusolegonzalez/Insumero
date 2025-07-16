import { useEffect, useState } from 'react';
const API_KEY='b41a4b24fe6bf359a7823cf321cd9ba5';
export function WeatherWidget(){
  const [now,setNow]=useState(null); const [forecast,setFc]=useState([]);
  useEffect(()=>{
    navigator.geolocation.getCurrentPosition(async({coords})=>{
      const {latitude,longitude}=coords;
      const base=`lat=${latitude}&lon=${longitude}&units=metric&lang=es&appid=${API_KEY}`;
      const [n,f]=await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?${base}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?${base}`)
      ]);
      setNow(await n.json());
      const list=(await f.json()).list.filter((_,i)=>i%8===0).slice(0,4);
      setFc(list);
    });
  },[]);
  if(!now) return <p>☁️ Cargando clima…</p>;
  return(
    <div className="card bg-light border-0 shadow-sm p-3">
      <h5 className="text-info">🌤️ Clima actual en {now.name}</h5>
      <p>Temp: {now.main.temp} °C · {now.weather[0].description}</p>
      <hr/>
      <h6>Próximos días</h6>
      <ul className="list-unstyled mb-0">
        {forecast.map((f,i)=>(
          <li key={i}>{new Date(f.dt_txt).toLocaleDateString()} – {Math.round(f.main.temp)} °C, {f.weather[0].main}</li>
        ))}
      </ul>
    </div>
  );
}