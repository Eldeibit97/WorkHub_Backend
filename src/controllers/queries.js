const { sql } = require('../config/db.js');

exports.getUsers = async (req,res) => {
    const users = await sql`SELECT * FROM "Usuario"`;
    res.json(users)
};