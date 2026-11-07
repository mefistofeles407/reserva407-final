import { ambientes, horarios, hoy } from '../domain/reservas'

export function TurnoFields({ turno, onChange }) {
  return <div className="form-grid">
    <label>Fecha<input type="date" min={hoy()} required value={turno.fecha}
      onChange={e => onChange('fecha', e.target.value)} /></label>
    <label>Hora<select value={turno.hora} onChange={e => onChange('hora', e.target.value)}>
      {horarios.map(hora => <option key={hora}>{hora}</option>)}
    </select></label>
    <label>Ambiente<select value={turno.ambiente} onChange={e => onChange('ambiente', e.target.value)}>
      {ambientes.map(ambiente => <option key={ambiente}>{ambiente}</option>)}
    </select></label>
  </div>
}
