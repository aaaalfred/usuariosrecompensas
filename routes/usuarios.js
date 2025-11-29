const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Función auxiliar para cargar perfiles y sucursales
async function cargarCatalogos() {
  const [perfiles] = await pool.query('SELECT id, perfil FROM perfiles ORDER BY perfil');
  const [sucursales] = await pool.query("SELECT id, sucursal FROM sucursales WHERE tipo = 'MAYOREO' ORDER BY sucursal");
  return { perfiles, sucursales };
}

// GET /usuarios - Pantalla de búsqueda
router.get('/', async (req, res) => {
  try {
    const [sucursales] = await pool.query("SELECT id, sucursal FROM sucursales WHERE tipo = 'MAYOREO' ORDER BY sucursal");
    res.render('usuarios_buscar', {
      sucursales,
      usuarios: [],
      sucursal_id: '',
      digitos: '',
      error: null,
      mensaje: null
    });
  } catch (err) {
    console.error('Error al cargar sucursales:', err);
    res.render('usuarios_buscar', {
      sucursales: [],
      usuarios: [],
      sucursal_id: '',
      digitos: '',
      error: 'Error al cargar sucursales',
      mensaje: null
    });
  }
});

// POST /usuarios/buscar - Buscar usuario por sucursal + últimos 2 dígitos
router.post('/buscar', async (req, res) => {
  const { sucursal_id, digitos } = req.body;

  try {
    const [sucursales] = await pool.query("SELECT id, sucursal FROM sucursales WHERE tipo = 'MAYOREO' ORDER BY sucursal");

    if (!sucursal_id) {
      return res.render('usuarios_buscar', {
        sucursales,
        usuarios: [],
        sucursal_id,
        digitos,
        error: 'Debe seleccionar una sucursal',
        mensaje: null
      });
    }

    if (!digitos || digitos.trim().length !== 2) {
      return res.render('usuarios_buscar', {
        sucursales,
        usuarios: [],
        sucursal_id,
        digitos,
        error: 'Debe ingresar exactamente 2 digitos',
        mensaje: null
      });
    }

    // Buscar usuarios por sucursal y últimos 2 dígitos de clave
    const [usuarios] = await pool.query(
      `SELECT id, clave, nombre, alias
       FROM usuarios
       WHERE sucursal_id = ? AND clave LIKE ?
       ORDER BY nombre`,
      [sucursal_id, `%${digitos.trim()}`]
    );

    if (usuarios.length === 0) {
      return res.render('usuarios_buscar', {
        sucursales,
        usuarios: [],
        sucursal_id,
        digitos,
        error: null,
        mensaje: 'No se encontraron usuarios con esos criterios'
      });
    }

    res.render('usuarios_buscar', {
      sucursales,
      usuarios,
      sucursal_id,
      digitos,
      error: null,
      mensaje: null
    });

  } catch (err) {
    console.error('Error al buscar usuario:', err);
    const [sucursales] = await pool.query("SELECT id, sucursal FROM sucursales WHERE tipo = 'MAYOREO' ORDER BY sucursal");
    return res.render('usuarios_buscar', {
      sucursales,
      usuarios: [],
      sucursal_id,
      digitos,
      error: 'Error al buscar usuario',
      mensaje: null
    });
  }
});

// GET /usuarios/nuevo - Formulario para crear usuario
router.get('/nuevo', async (req, res) => {
  const clave = req.query.clave || '';

  try {
    const { perfiles, sucursales } = await cargarCatalogos();

    res.render('usuarios_form', {
      usuario: { clave },
      perfiles,
      sucursales,
      esEdicion: false,
      error: null,
      mensaje: null
    });
  } catch (err) {
    console.error('Error al cargar catalogos:', err);
    res.render('usuarios_form', {
      usuario: { clave },
      perfiles: [],
      sucursales: [],
      esEdicion: false,
      error: 'Error al cargar catalogos',
      mensaje: null
    });
  }
});

// POST /usuarios/nuevo - Crear usuario
router.post('/nuevo', async (req, res) => {
  const { nombre, alias, nip, perfil_id, sucursal_id, clave } = req.body;

  // Validaciones
  const errores = [];
  if (!nombre || nombre.trim() === '') errores.push('El nombre es requerido');
  if (!nip || nip.trim() === '') errores.push('El NIP es requerido');
  if (nip && nip.length > 5) errores.push('El NIP debe tener maximo 5 caracteres');
  if (!perfil_id) errores.push('Debe seleccionar un perfil');
  if (!sucursal_id) errores.push('Debe seleccionar una sucursal');
  if (!clave || clave.trim() === '') errores.push('La clave es requerida');

  try {
    const { perfiles, sucursales } = await cargarCatalogos();

    if (errores.length > 0) {
      return res.render('usuarios_form', {
        usuario: req.body,
        perfiles,
        sucursales,
        esEdicion: false,
        error: errores.join(', '),
        mensaje: null
      });
    }

    // Verificar que la clave no exista
    const [existente] = await pool.query('SELECT id FROM usuarios WHERE clave = ?', [clave.trim()]);
    if (existente.length > 0) {
      return res.render('usuarios_form', {
        usuario: req.body,
        perfiles,
        sucursales,
        esEdicion: false,
        error: 'Ya existe un usuario con esa clave',
        mensaje: null
      });
    }

    // Insertar usuario
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, alias, nip, perfil_id, sucursal_id, clave)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), alias?.trim() || null, nip.trim(), perfil_id, sucursal_id, clave.trim()]
    );

    return res.redirect(`/usuarios/editar/${result.insertId}?mensaje=Usuario creado exitosamente`);

  } catch (err) {
    console.error('Error al crear usuario:', err);
    const { perfiles, sucursales } = await cargarCatalogos();
    return res.render('usuarios_form', {
      usuario: req.body,
      perfiles,
      sucursales,
      esEdicion: false,
      error: 'Error al crear usuario',
      mensaje: null
    });
  }
});

// GET /usuarios/editar/:id - Formulario para editar usuario
router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const mensaje = req.query.mensaje || null;

  try {
    const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);

    if (usuarios.length === 0) {
      return res.redirect('/usuarios?error=Usuario no encontrado');
    }

    const { perfiles, sucursales } = await cargarCatalogos();

    res.render('usuarios_form', {
      usuario: usuarios[0],
      perfiles,
      sucursales,
      esEdicion: true,
      error: null,
      mensaje
    });
  } catch (err) {
    console.error('Error al cargar usuario:', err);
    return res.redirect('/usuarios?error=Error al cargar usuario');
  }
});

// POST /usuarios/editar/:id - Actualizar usuario
router.post('/editar/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, alias, nip, perfil_id, sucursal_id } = req.body;

  // Validaciones
  const errores = [];
  if (!nombre || nombre.trim() === '') errores.push('El nombre es requerido');
  if (!nip || nip.trim() === '') errores.push('El NIP es requerido');
  if (nip && nip.length > 5) errores.push('El NIP debe tener maximo 5 caracteres');
  if (!perfil_id) errores.push('Debe seleccionar un perfil');
  if (!sucursal_id) errores.push('Debe seleccionar una sucursal');

  try {
    const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);

    if (usuarios.length === 0) {
      return res.redirect('/usuarios?error=Usuario no encontrado');
    }

    const { perfiles, sucursales } = await cargarCatalogos();

    if (errores.length > 0) {
      return res.render('usuarios_form', {
        usuario: { ...usuarios[0], ...req.body },
        perfiles,
        sucursales,
        esEdicion: true,
        error: errores.join(', '),
        mensaje: null
      });
    }

    // Actualizar solo los campos permitidos
    await pool.query(
      `UPDATE usuarios SET nombre = ?, alias = ?, nip = ?, perfil_id = ?, sucursal_id = ? WHERE id = ?`,
      [nombre.trim(), alias?.trim() || null, nip.trim(), perfil_id, sucursal_id, id]
    );

    return res.redirect(`/usuarios/editar/${id}?mensaje=Usuario actualizado exitosamente`);

  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    const { perfiles, sucursales } = await cargarCatalogos();
    const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return res.render('usuarios_form', {
      usuario: usuarios[0] || req.body,
      perfiles,
      sucursales,
      esEdicion: true,
      error: 'Error al actualizar usuario',
      mensaje: null
    });
  }
});

module.exports = router;
