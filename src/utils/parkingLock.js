/**
 * parkingLock.js
 *
 * Mutex en memoria para serializar asignaciones de espacios de parking.
 * Usa un lock global único porque el edificio se determina DENTRO
 * de la operación — no se puede lockear por edificio antes de saber cuál es.
 *
 * Funcionamiento:
 *   - Cada llamada a withParkingLock() encadena una Promise al final de la cola.
 *   - El siguiente turno empieza solo cuando el anterior llama a release().
 *   - Si el servidor tiene una sola instancia, esto es suficiente.
 *   - Si en el futuro se despliegan múltiples instancias, migrar a FOR UPDATE SKIP LOCKED en Postgres.
 */

// Cola de promesas: cada entrada es la Promise que representa un turno pendiente.
let lockChain = Promise.resolve()

/**
 * Ejecuta `fn` de forma exclusiva — ninguna otra llamada a withParkingLock
 * puede ejecutar su `fn` al mismo tiempo.
 *
 * @param {() => Promise<T>} fn  Función async con la lógica crítica (buscar edificio + crear reserva)
 * @returns {Promise<T>}         Lo que retorne `fn`
 */
async function withParkingLock(fn) {
  // Guardamos el estado actual de la cadena antes de extenderla
  const waitFor = lockChain

  // Token de release: lo resolvemos cuando fn termine (éxito o error)
  let release
  const myTurn = new Promise((res) => { release = res })

  // Extender la cadena: el siguiente en llegar esperará a myTurn
  lockChain = waitFor.then(() => myTurn)

  // Esperar nuestro turno
  await waitFor

  try {
    return await fn()
  } finally {
    // Siempre liberar, aunque fn haya lanzado un error
    release()
  }
}

module.exports = {withParkingLock }