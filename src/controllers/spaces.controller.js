const spacesService = require('../services/spaces.service');
const { sql } = require('../config/db.js');
const { parsePgIntId } = require('../utils/pgInt');

function isValidISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime());
}

async function getTiposEspacio(req, res) {
  try {
    const tipos = await spacesService.listTiposEspacio();
    return res.status(200).json(tipos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar tipos de espacio' });
  }
}

async function getZonas(req, res) {
  try {
    const zonas = await spacesService.listZonas();
    return res.status(200).json(zonas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar zonas' });
  }
}

async function getSpaces(req, res) {
  try {
    const zonaId = spacesService.parseZonaId(req.query.zonaId);
    if (Number.isNaN(zonaId)) {
      return res.status(400).json({ message: 'Query zonaId es requerido (número)' });
    }

    const exists = await sql`SELECT 1 FROM public."Zona" z WHERE z.id_zona = ${zonaId} LIMIT 1`;
    if (!exists.length) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }

    const spaces = await spacesService.listSpacesByZona(zonaId);
    return res.status(200).json(spaces);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar espacios' });
  }
}

async function getSpacesAvailability(req, res) {
  try {
    const zonaId = spacesService.parseZonaId(req.query.zonaId);
    const fecha = req.query.fecha;
    const horaInicio = req.query.horaInicio;
    const horaFin = req.query.horaFin;

    if (Number.isNaN(zonaId)) {
      return res.status(400).json({ message: 'Query zonaId es requerido (número)' });
    }
    if (!fecha || !isValidISODate(String(fecha))) {
      return res.status(400).json({ message: 'Query fecha debe ser YYYY-MM-DD' });
    }

    const exists = await sql`SELECT 1 FROM public."Zona" z WHERE z.id_zona = ${zonaId} LIMIT 1`;
    if (!exists.length) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }

    const data = await spacesService.fetchAvailabilityWindow(
      zonaId,
      String(fecha),
      horaInicio,
      horaFin
    );
    return res.status(200).json(data);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error al consultar disponibilidad' });
  }
}

async function getSpaceSchedule(req, res) {
  try {
    const idEspacio = parsePgIntId(req.params.idEspacio);
    const fecha = req.query.fecha;

    if (Number.isNaN(idEspacio)) {
      return res.status(400).json({ message: 'id de espacio inválido' });
    }
    if (!fecha || !isValidISODate(String(fecha))) {
      return res.status(400).json({ message: 'Query fecha debe ser YYYY-MM-DD' });
    }

    const esp = await sql`
      SELECT e.id_espacio FROM public."Espacio" e WHERE e.id_espacio = ${idEspacio} LIMIT 1
    `;
    if (!esp.length) {
      return res.status(404).json({ message: 'Espacio no encontrado' });
    }

    const payload = await spacesService.buildScheduleBlocks(idEspacio, String(fecha));
    return res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener horario' });
  }
}

async function getParkingSpaces(req, res) {
  try{
    const spaces = await spacesService.fetchParkingSpaces();
    return res.status(201).json(spaces);
  }catch(error){
    return res.status(500).json(error);
  }
}

module.exports = {
  getTiposEspacio,
  getZonas,
  getSpaces,
  getSpacesAvailability,
  getSpaceSchedule,
  getParkingSpaces
};
