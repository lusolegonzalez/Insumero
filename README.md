# Insumero

API y frontend para consultar precios, costos y guardar historial.

## Endpoints

- `GET /`: Prueba de vida de la API.
- `GET /api/fob`: Precios FOB por producto mapeado. Usa la fecha de hoy y cachea resultados en memoria.
- `GET /api/precios`: Precios internacionales estimados (USD/ton) para soja, maíz y trigo desde Yahoo. Cacheados por 5 minutos (configurable).
- `GET /api/cultivos`: Devuelve requerimientos y costos base por cultivo desde `backend/crops.json`.
- `POST /api/margen`: Calcula margen por hectárea.
  - Body (JSON): `{ "cultivo": "soja|maiz|trigo", "rendimiento_t_ha": number, "precio_usd_ton": number }`
  - Respuesta: `{ ingreso_usd_ha, costo_usd_ha, margen_usd_ha, ... }`
- `GET /api/historial`: Lista el historial guardado en Firestore.
- `POST /api/historial`: Persiste un item de historial `{ ... }` con `fecha` en Firestore.

## Variables de entorno

Ver `.env.example`. Notas:

- `PORT`: Puerto del backend (por defecto `3001`).
- `FIREBASE_*`: Credenciales de service account para Firestore.
- `CACHE_MIN`: Minutos de cache para respuestas externas (si no se define, `FOB` usa 60 min y `precios` 5 min).

## Desarrollo

- Backend: `cd backend && npm i && npm run dev`
- Build frontend: `cd backend && npm run build`

El backend sirve el build del frontend desde `frontend/build`.
