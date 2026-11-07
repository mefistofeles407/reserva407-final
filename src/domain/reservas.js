export const horarios = ['12:00', '13:00', '14:00', '15:00']
export const ambientes = ['Principal', 'VIP', 'Terraza']
export const adelantoPorMesa = 100
export const hoy = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima' }).format()

export function disponible({ mesas, reservas }, id, fecha, hora) {
  const mesa = mesas.find(item => item.id === id)
  return Boolean(mesa && !mesa.ocupada && !mesa.bloqueada && !reservas.some(reserva =>
    reserva.fecha === fecha && reserva.hora === hora && reserva.mesas.includes(id)))
}

export function puedeCancelar(reserva, ahora = Date.now()) {
  const tiempo = ahora - Date.parse(reserva.creadaEn)
  return reserva.estado === 'Activa' && tiempo >= 0 && tiempo <= 15 * 60_000
}
