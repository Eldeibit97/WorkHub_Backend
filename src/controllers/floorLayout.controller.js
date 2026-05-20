const floorLayoutService = require('../services/floorLayout.service');
const { parsePgIntId } = require('../utils/pgInt');

async function putFloorLayout(req, res) {
  try {
    const zonaId = parsePgIntId(req.params.id);
    if (Number.isNaN(zonaId)) {
      return res.status(400).json({ message: 'id de zona inválido' });
    }

    const result = await floorLayoutService.saveFloorLayout(zonaId, req.body || {});
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error('putFloorLayout', error);
    return res.status(500).json({ message: 'Error al guardar layout' });
  }
}

module.exports = { putFloorLayout };
