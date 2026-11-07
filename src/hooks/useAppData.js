import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../data/api'
import { disponible } from '../domain/reservas'

const inicial = { user: null, mesas: [], reservas: [], reclamaciones: [], disponibilidad: [] }

export function useAppData(setMensaje) {
  const [datos, setDatos] = useState(inicial)
  const [cargando, setCargando] = useState(true)
  const [errorConexion, setErrorConexion] = useState('')
  const peticion = useRef(0)

  const cargar = useCallback(async signal => {
    const secuencia = ++peticion.current
    const resultado = await api('estado', undefined, signal)
    if (signal?.aborted || secuencia !== peticion.current) return
    if (resultado.ok) setDatos(resultado.datos)
    setErrorConexion(resultado.ok ? '' : resultado.mensaje)
    setCargando(false)
  }, [])

  useEffect(() => {
    const control = new AbortController()
    const actualizar = () => { cargar(control.signal) }
    actualizar()
    const reloj = setInterval(actualizar, 3000)
    window.addEventListener('focus', actualizar)
    return () => {
      control.abort()
      clearInterval(reloj)
      window.removeEventListener('focus', actualizar)
    }
  }, [cargar])

  async function ejecutar(accion, cuerpo) {
    const resultado = await api(accion, cuerpo)
    if (resultado.ok && ['login', 'registro', 'logout'].includes(accion)) {
      ++peticion.current
      setDatos({ ...inicial, user: resultado.usuario })
    }
    if (resultado.mensaje) setMensaje(resultado.mensaje)
    await cargar()
    return resultado
  }

  return {
    ...datos, cargando, errorConexion,
    disponible: (...args) => disponible({ mesas: datos.mesas, reservas: datos.disponibilidad }, ...args),
    autenticar: (accion, cuerpo) => ejecutar(accion, cuerpo),
    crearReserva: seleccion => ejecutar('crear', seleccion),
    modificarReserva: (codigo, turno) => ejecutar('editar', { ...turno, codigo }),
    cancelarReserva: (codigo, contacto = '') => ejecutar('cancelar', { codigo, contacto }),
    solicitarReembolso: (codigo, contacto = '') => ejecutar('solicitar-reembolso', { codigo, contacto }),
    procesarReembolso: codigo => ejecutar('procesar-reembolso', { codigo }),
    enviarReclamacion: formulario => ejecutar('reclamar', formulario),
    avanzarReclamacion: codigo => ejecutar('avanzar-reclamacion', { codigo }),
    alternarOcupacion: (id, valor) => ejecutar('mesa', { id, campo: 'ocupada', valor }),
    alternarBloqueo: (id, valor) => ejecutar('mesa', { id, campo: 'bloqueada', valor }),
  }
}
