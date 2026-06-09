'use strict';
/**
 * TC-ULI-07 / TC-ULI-09 — Servicio de correo (mock nodemailer)
 * Cubre: src/services/email.service.js
 */
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-123' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

const { sendConfirmationEmail, sendCancellationEmail } = require('../../services/email.service');

const detalles = {
  guestEmail: 'empleado@acn.com', guestName: 'Juan Ángel',
  date: '2026-06-15', horaInicio: '09:00', horaFin: '11:00',
  nombreEspacio: 'Sala A', codigoEspacio: 'SA-01',
  nombreZona: 'Zona Norte', edificio: 'Torre 1',
};

describe('email.service', () => {
  beforeEach(() => mockSendMail.mockClear());

  test('TC-ULI-07: sendConfirmationEmail llama sendMail una vez', async () => {
    await sendConfirmationEmail(detalles);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
  test('TC-ULI-07: correo de confirmación va al destinatario correcto', async () => {
    await sendConfirmationEmail(detalles);
    const opts = mockSendMail.mock.calls[0][0];
    expect(opts.to).toBe('empleado@acn.com');
    expect(opts.subject).toContain('2026-06-15');
  });
  test('TC-ULI-07: HTML del correo menciona el nombre del empleado', async () => {
    await sendConfirmationEmail(detalles);
    const opts = mockSendMail.mock.calls[0][0];
    expect(opts.html).toContain('Juan Ángel');
  });
  test('TC-ULI-09: sendCancellationEmail llama sendMail una vez', async () => {
    await sendCancellationEmail(detalles);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
  test('TC-ULI-09: asunto del correo de cancelación contiene "cancelad"', async () => {
    await sendCancellationEmail(detalles);
    const opts = mockSendMail.mock.calls[0][0];
    expect(opts.subject).toMatch(/cancelad/i);
    expect(opts.to).toBe('empleado@acn.com');
  });
});
