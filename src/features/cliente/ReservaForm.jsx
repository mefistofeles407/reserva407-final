import { useState } from 'react'
import { adelantoPorMesa, hoy } from '../../domain/reservas'
import { TurnoFields } from '../../shared/TurnoFields'

export function ReservaForm({ seleccion, setSeleccion, disponible, mesas, onConfirmar, onVolver }) {
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo, valor) => setSeleccion(actual => ({ ...actual, [campo]: valor }))
  const cambiarTurno = (campo, valor) => setSeleccion(actual => ({ ...actual, [campo]: valor, mesas: [] }))
  const alternar = id => cambiar('mesas', seleccion.mesas.includes(id)
    ? seleccion.mesas.filter(item => item !== id) : [...seleccion.mesas, id])
  const visibles = mesas.filter(mesa => mesa.ambiente === seleccion.ambiente)
  const habilitada = seleccion.fecha >= hoy() && seleccion.acepta && seleccion.nombre.trim() &&
    (seleccion.correo.trim() || seleccion.telefono.trim()) && seleccion.mesas.length

  async function confirmar(evento) {
    evento.preventDefault()
    if (guardando || !habilitada) return
    setGuardando(true)
    try {
      await onConfirmar()
    } finally {
      setGuardando(false)
    }
  }

  return <section className="panel">
    <div className="section-heading">
      <div><span className="eyebrow">Flujo cliente</span><h2>Nueva reserva</h2></div>
      <button className="link" onClick={onVolver} disabled={guardando}>Volver</button>
    </div>
    <form onSubmit={confirmar}>
      <fieldset disabled={guardando}>
        <legend>Fecha, hora y mesas</legend>
        <TurnoFields turno={seleccion} onChange={cambiarTurno} />
        <div className="table-map">
          {visibles.map(({ id }) => {
            const elegida = seleccion.mesas.includes(id)
            const libre = disponible(id, seleccion.fecha, seleccion.hora)
            return <button type="button" key={id} disabled={!libre && !elegida}
              aria-pressed={elegida} className={`table-seat ${elegida ? 'selected' : ''}`}
              onClick={() => alternar(id)}>
              <strong>{id}</strong>
              <span>{libre ? (elegida ? 'Seleccionada' : 'Disponible') : (elegida ? 'No disponible · retirar' : 'No disponible')}</span>
            </button>
          })}
        </div>
        <div className="form-grid">
          <label>Nombre<input required autoComplete="name" value={seleccion.nombre} onChange={e => cambiar('nombre', e.target.value)} /></label>
          <label>Teléfono<input type="tel" autoComplete="tel" value={seleccion.telefono} onChange={e => cambiar('telefono', e.target.value)} /></label>
          <label>Correo<input type="email" autoComplete="email" value={seleccion.correo} onChange={e => cambiar('correo', e.target.value)} /></label>
        </div>
        <p className="helper">Ingresa al menos un correo o teléfono para consultar tu reserva.</p>
        <details open>
          <summary>Condiciones de la reserva</summary>
          <p>Hasta 4 personas por mesa. El adelanto simulado de S/100 por mesa se aplica al consumo.
            Hay 15 minutos de tolerancia desde la hora reservada. Si no te presentas, pierdes el adelanto.
            Puedes cancelar dentro de los primeros 15 minutos desde la confirmación y solicitar el reembolso por separado.</p>
        </details>
        <label className="checkbox"><input type="checkbox" required checked={seleccion.acepta}
          onChange={e => cambiar('acepta', e.target.checked)} /> Acepto las condiciones de la reserva.</label>
        <div className="summary"><span>{seleccion.mesas.length} mesa(s)</span>
          <strong>Adelanto: S/{seleccion.mesas.length * adelantoPorMesa}</strong></div>
        <button className="primary full" disabled={!habilitada || guardando}>
          {guardando ? 'Verificando disponibilidad…' : 'Simular adelanto y confirmar reserva'}
        </button>
      </fieldset>
    </form>
  </section>
}
