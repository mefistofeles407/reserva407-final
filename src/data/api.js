export async function api(accion = 'estado', datos, signal) {
  try {
    const respuesta = await fetch(`/Reserva407/index.php?accion=${encodeURIComponent(accion)}`, {
      signal,
      credentials: 'same-origin',
      ...(datos === undefined ? {} : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      }),
    })
    return await respuesta.json()
  } catch {
    return { ok: false, mensaje: 'No se pudo conectar con Reserva407. Comprueba Apache y MariaDB.' }
  }
}
