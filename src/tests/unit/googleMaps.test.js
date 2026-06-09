'use strict';
/**
 * TC-DAV-08 — Manejo de error si Google Maps no responde
 * (Google Maps se usa en el frontend; aquí se prueba el patrón defensivo)
 */
describe('TC-DAV-08: Manejo de error ante API externa no disponible', () => {
  async function fetchGoogleMapsRoute(origin, destination, apiKey) {
    if (!apiKey || apiKey === '') {
      return { ok: false, status: 401, message: 'API key requerida' };
    }
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`
      );
      if (!response.ok) {
        return { ok: false, status: response.status, message: 'Error al conectar con Google Maps' };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, status: 503, message: 'Google Maps no disponible', error: error.message };
    }
  }

  test('sin API key → 401', async () => {
    const r = await fetchGoogleMapsRoute('origen', 'destino', '');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });
  test('error de red → 503 sin explotar', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));
    const r = await fetchGoogleMapsRoute('origen', 'destino', 'key123');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(503);
    expect(r.message).toMatch(/no disponible/i);
  });
  test('respuesta 403 de Google (key inválida) → error controlado', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, json: jest.fn() });
    const r = await fetchGoogleMapsRoute('origen', 'destino', 'bad-key');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(403);
  });
  test('patrón defensivo: excepción no propagada al caller', () => {
    const handleExternalApiError = (error) => ({
      ok: false, status: 503,
      message: 'Servicio externo no disponible',
      detail: error?.message ?? 'Unknown error',
    });
    const result = handleExternalApiError(new Error('ECONNREFUSED'));
    expect(result.ok).toBe(false);
    expect(result.detail).toBe('ECONNREFUSED');
  });
});
