export async function saveToHistory(record){
  // record = { cultivo:'soja', hectareas:1, resultado:{..} }
  try {
    console.log('Guardando en historial:', record);
    await fetch('http://localhost:3001/api/historial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  } catch (e) {
    console.error('No se pudo guardar historial', e);
  }
}