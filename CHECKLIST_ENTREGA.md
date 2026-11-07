# Checklist final de entrega

## Aplicación

- [ ] Apache sirve `C:\xampp\htdocs\Reserva407` y MariaDB usa `127.0.0.1:3307/reserva407`.
- [ ] El SQL inicializa la base con las 18 mesas y la cuenta administrativa demo.
- [ ] Cliente puede registrarse, iniciar y cerrar sesión. Se rechazan correos duplicados y contraseñas incorrectas.
- [ ] Una reserva autenticada queda asociada a su usuario en MariaDB y se recupera al recargar.
- [ ] Otra cuenta no recibe los datos privados de la reserva sin acreditar el contacto en la consulta.
- [ ] Un cliente no puede realizar operaciones administrativas desde la API.
- [ ] `npm.cmd run dev` inicia la aplicación sin errores.
- [ ] `npm.cmd run build` termina correctamente.
- [ ] Existe la carpeta `dist`.
- [ ] El flujo Cliente permite crear una reserva.
- [ ] La disponibilidad impide usar mesas reservadas, ocupadas o bloqueadas.
- [ ] La consulta muestra una reserva por código y correo o teléfono.
- [ ] La cancelación habilita la solicitud de reembolso.
- [ ] Administración procesa reembolsos.
- [ ] Cliente envía reclamaciones.
- [ ] Administración cambia reclamaciones hasta Resuelta.
- [ ] Administración ocupa, libera, bloquea y desbloquea mesas.
- [ ] El login administrativo funciona.
- [ ] El calendario filtra reservas por fecha.
- [ ] La edición administrativa modifica fecha, hora, ambiente y mesas.
- [ ] La edición detecta conflictos de disponibilidad.
- [ ] Dos confirmaciones simultáneas para la misma mesa y turno generan una sola reserva.
- [ ] No presentado se aplica tras la tolerancia y respeta ocupación, estados y datos históricos.
- [ ] La vista se adapta a móvil y escritorio.

## Archivos

- [ ] Completar los tres integrantes en `README.md`.
- [ ] Añadir enlace de Figma al README o documento final.
- [ ] Crear repositorio de GitHub.
- [ ] Subir el código sin `node_modules`.
- [ ] Comprobar que `.gitignore` excluya `node_modules` y `dist`.
- [ ] Añadir capturas necesarias para la sustentación.
- [ ] Guardar una copia ZIP del proyecto completo sin `node_modules`.

## Presentación

- [ ] Explicar problema y solución.
- [ ] Mostrar flujo Cliente.
- [ ] Mostrar calendario y gestión administrativa.
- [ ] Demostrar prevención de duplicaciones.
- [ ] Explicar componentes reutilizables.
- [ ] Explicar `useState` y `useEffect`.
- [ ] Mostrar una mejora derivada de las pruebas de usabilidad.
