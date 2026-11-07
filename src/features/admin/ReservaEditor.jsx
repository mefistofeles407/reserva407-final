import { useState } from 'react'
import { TurnoFields } from '../../shared/TurnoFields'

export function ReservaEditor({ reserva, mesas, onGuardar, onCancelar, onCerrar, onRevisarMesas }) {
  const [turno, setTurno] = useState({
    fecha: reserva.fecha, hora: reserva.hora, ambiente: reserva.ambiente, mesas: reserva.mesas,
  })
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const activa = reserva.estado === 'Activa'
  const visibles = mesas.filter(mesa => mesa.ambiente === turno.ambiente)

  async function ejecutar(accion) {
    setOcupado(true)
    setError('')
    try {
      const resultado = await accion()
      if (resultado.ok) onCerrar()
      else setError(resultado.mensaje)
    } finally {
      setOcupado(false)
    }
  }

  return <article className="editor-card">
    <div className="section-heading">
      <div><span className="eyebrow">Detalle de reserva</span><h3>{reserva.codigo}</h3></div>
      <button className="link" onClick={onCerrar} disabled={ocupado}>Cerrar</button>
    </div>
    <p>{reserva.nombre} · {[reserva.correo, reserva.telefono].filter(Boolean).join(' · ') || reserva.contacto}</p>
    <p>{reserva.estado} · Adelanto registrado S/{reserva.adelanto}</p>
    {reserva.estado === 'No presentado' && <>
      <p>Mesas de la reserva: {reserva.mesas.join(', ')}. El turno ya no está comprometido por esta reserva.</p>
      <p>Registrado el {new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima',
      }).format(new Date(reserva.noPresentadoEn))} (Lima).</p>
      <button className="secondary" onClick={() => onRevisarMesas(reserva.mesas)}>Revisar mesas</button>
    </>}
    <form onSubmit={evento => {
      evento.preventDefault()
      if (activa && !ocupado && turno.mesas.length) ejecutar(() => onGuardar(reserva.codigo, turno))
    }}>
      <fieldset disabled={!activa || ocupado}>
        <TurnoFields turno={turno} onChange={(campo, valor) => setTurno(actual => ({
          ...actual, [campo]: valor, mesas: campo === 'ambiente' ? [] : actual.mesas,
        }))} />
        <div className="mini-map">
          {visibles.map(({ id }) => {
            const elegida = turno.mesas.includes(id)
            return <button type="button" key={id} aria-pressed={elegida} className={elegida ? 'selected' : ''}
              onClick={() => setTurno(actual => ({ ...actual, mesas: elegida
                ? actual.mesas.filter(item => item !== id) : [...actual.mesas, id] }))}>{id}</button>
          })}
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        {activa && <div className="actions">
          <button className="primary" disabled={!turno.mesas.length}>Guardar cambios</button>
          <button type="button" className="danger" onClick={() => ejecutar(() => onCancelar(reserva.codigo))}>Cancelar reserva</button>
        </div>}
      </fieldset>
    </form>
  </article>
}
