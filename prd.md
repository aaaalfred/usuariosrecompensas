Eres un asistente de desarrollo experto en **Node.js, Express y MySQL**.  
Quiero que construyas un **MVP sencillo** de una app web para gestionar la tabla `usuarios` en MySQL.

---

## 🎯 Objetivo general

Desarrollar una **aplicación web simple** que:

1. Tenga una **pantalla de login** básica (solo un usuario administrador para entrar).
2. Una vez logueado, permita:
   - **Buscar** un usuario por el campo `clave`.
   - Si el usuario **existe**, mostrar un formulario para **editar solo ciertos campos**.
   - Si el usuario **no existe**, mostrar un formulario para **crear** un nuevo registro, con la `clave` ya prellenada.
3. El sistema solo debe permitir:
   - **Crear nuevo registro**.
   - **Actualizar registro existente**.  
   No necesito listado general, ni eliminación de usuarios en esta versión.

---

## 🧱 Stack técnico requerido

Quiero que el proyecto use:

- **Backend**
  - Express

- **Base de datos**
  - MySQL (ya existente)

- **Conexión a MySQL**
  - Driver: `mysql2` (usando `createPool`)

- **Vistas / Frontend**
  - Motor de plantillas: **EJS**
  - Formularios HTML clásicos (no SPA, no React)

- **Autenticación**
  - `express-session` para manejar la sesión del usuario
  - `bcrypt` para el hash de la contraseña del usuario admin
  - Auth sencilla:
    - Un solo usuario administrador para ingresar al sistema
    - Leerlo desde variables de entorno

- **Configuración**
  - Variables de entorno con `.env` usando `dotenv`
  - Variables esperadas:
    - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
    - `SESSION_SECRET`
    - Si se usa usuario admin por entorno: `ADMIN_USER`, `ADMIN_PASSWORD_HASH`

---

## 🗄️ Estructura de tablas (existentes)

Usa **exactamente** estas estructuras de ejemplo:

```sql
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `alias` varchar(255) DEFAULT NULL,
  `nip` varchar(5) NOT NULL,
  `sucursal_id` int(11) DEFAULT NULL,
  `regiones` varchar(255) DEFAULT NULL,
  `perfil_id` int(11) NOT NULL,
  `nivel` int(11) DEFAULT '1',
  `score` int(11) DEFAULT NULL,
  `status` varchar(11) DEFAULT NULL,
  `clave` varchar(20) NOT NULL,
  `reg_not` int(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `perfiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `perfil` varchar(255) NOT NULL,
  `no_general` int(11) NOT NULL,
  `general` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `sucursales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sucursal` varchar(255) DEFAULT NULL,
  `no_sucursal` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `no_region` varchar(255) DEFAULT NULL,
  `tipo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

---

## 🔗 Relaciones y reglas de negocio
Relación usuarios → perfiles

usuarios.perfil_id está vinculado con perfiles.no_general.

En la interfaz, en un <select> para elegir el perfil:

Valor (value) del <option>: perfiles.no_general

Texto mostrado: perfiles.general

Cuando se edite un usuario:

Se debe mostrar el perfil actual del usuario como opción seleccionada.

Para llenar el combo de perfiles, haz una consulta a la tabla perfiles.

Relación usuarios → sucursales

usuarios.sucursal_id está vinculado a sucursales.id.

En la interfaz, en un <select> para elegir la sucursal:

Valor (value) del <option>: sucursales.id

Texto mostrado: sucursales.sucursal (nombre de la sucursal).

Cuando se edite un usuario:

Se debe mostrar la sucursal actual del usuario como opción seleccionada.

Para llenar el combo de sucursales, haz una consulta a la tabla sucursales.

🧩 Flujos funcionales
1. Login

Rutas requeridas:

GET /login

Muestra un formulario con:

username

password

POST /login

Valida las credenciales:

Puede  comparar contra valores de entorno.

Compara la contraseña con bcrypt.compare.

Si son correctas:

Guarda algo como req.session.userId = id_del_usuario o un flag req.session.isAdmin = true.

Redirige a /usuarios.

Si son incorrectas:

Muestra de nuevo el formulario con un mensaje de error simple.

Middleware de autenticación

Crea un middleware requireAuth que:

Verifique si la sesión está activa (por ejemplo req.session.userId o req.session.isAdmin).

Si NO está autenticado → redirigir a /login.

Aplica este middleware a todas las rutas de /usuarios/*.

2. Pantalla principal de búsqueda de usuario

GET /usuarios (protegido con requireAuth)

Muestra un formulario con un campo:

clave (input text)

Botón: “Buscar”.

POST /usuarios/buscar

Recibe el valor de clave desde el formulario.

Hace una consulta a la tabla usuarios:

SELECT * FROM usuarios WHERE clave = ? LIMIT 1

Comportamiento:

Si encuentra un registro:

Redirige a /usuarios/editar/:id (usando id del usuario encontrado).

Si no encuentra:

Redirige a /usuarios/nuevo?clave=valorBuscado para crear un nuevo registro con esa clave.

3. Crear nuevo usuario

GET /usuarios/nuevo (protegido con requireAuth)

Muestra un formulario para crear un usuario nuevo.

Reglas:

Si viene el query param clave, el campo clave en el formulario debe venir prellenado y restringido (solo lectura o deshabilitado para que no se cambie).

Cargar combos:

perfiles: desde tabla perfiles (usar no_general y general).

sucursales: desde tabla sucursales (usar id y sucursal).

Campos a mostrar y permitir capturar:

nombre (editable, requerido)

alias (editable, opcional)

nip (editable, requerido, longitud 5 chars)

perfil_id (select basado en perfiles.no_general)

sucursal_id (select basado en sucursales.id)

clave (prellenado y no editable si viene en query param)

POST /usuarios/nuevo

Inserta el registro en la tabla usuarios con los campos:

nombre, alias, nip, perfil_id, sucursal_id, clave

Los demás campos (nivel, score, status, regiones, reg_not) pueden setearse a valores por defecto o NULL.

Al terminar:

Redirigir a /usuarios o bien a /usuarios/editar/:id recién creado.

4. Editar usuario existente

GET /usuarios/editar/:id (protegido con requireAuth)

Busca el usuario por id en la tabla usuarios.

Si no existe, mostrar mensaje de “Usuario no encontrado”.

Si existe:

Cargar combos de perfiles y sucursales igual que en /usuarios/nuevo.

Prellenar el formulario con los datos del usuario.

Reglas de edición:

Solo se deben poder cambiar:

nombre

alias

nip

perfil_id

sucursal_id

Los demás campos se mantienen sin cambios (no editables en la interfaz).

clave NO debe poder modificarse (solo lectura).

POST /usuarios/editar/:id

Actualiza en la tabla usuarios solo los campos:

nombre, alias, nip, perfil_id, sucursal_id

Mantener intactos otros campos como:

regiones, nivel, score, status, reg_not, clave.

Al terminar:

Redirigir a /usuarios o de nuevo a /usuarios/editar/:id con mensaje de éxito.

✅ Validaciones mínimas

nombre: requerido.

nip: requerido, longitud máxima 5 caracteres.

perfil_id: requerido, debe existir en perfiles.no_general.

sucursal_id: requerido, debe existir en sucursales.id.

clave: requerido y único (de preferencia validar que no se duplique al crear).

🗂️ Entregables esperados (a nivel código)

Quiero que generes:

Estructura de proyecto recomendada, por ejemplo:

app.js o server.js

/config/db.js o similar para la conexión MySQL

/routes/usuarios.js para las rutas del CRUD

/routes/auth.js para login/logout

/views/ con:

login.ejs

usuarios_buscar.ejs

usuarios_form.ejs (mismo template para nuevo/editar con lógica condicional)

Código completo de:

Configuración de Express, express-session, dotenv, mysql2.

Middlewares (requireAuth).

Rutas para login, logout, búsqueda, nuevo y editar.

Ejemplos de vistas EJS con los formularios correspondientes.

Quiero que el código sea claro, organizado y listo para pegar en archivos reales.