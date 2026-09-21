/* ============================================================
   Listaro — almacén de datos en el navegador (localStorage)
   Reemplaza al servidor: aquí viven las cuentas y el inventario.
   ============================================================ */

const Datos = (() => {

  const CLAVE = "listaro:datos";
  const CLAVE_SESION = "listaro:sesion";

  /* ---------------------------------------------------- utilidades */
  function ahora() {
    return new Date().toISOString().slice(0, 16).replace("T", " ");
  }

  function nuevoId(lista) {
    return lista.length ? Math.max(...lista.map((x) => x.id)) + 1 : 1;
  }

  /* ---------------------------------------------------- estado base */
  function semilla() {
    const f = ahora();
    return {
      usuarios: [
        { id: 1, nombre: "Cuenta demo", correo: "demo@listaro.co", clave: "demo1234" },
      ],
      edificios: [
        { id: 1, usuarioId: 1, nombre: "Hotel Central", direccion: "Cra. 7 #45-12, Bogotá", notas: "" },
        { id: 2, usuarioId: 1, nombre: "Edificio Norte", direccion: "Calle 116 #18-30, Bogotá", notas: "" },
      ],
      habitaciones: [
        { id: 1, edificioId: 1, nombre: "Habitación 101", piso: "1", estado: "activa" },
        { id: 2, edificioId: 1, nombre: "Habitación 102", piso: "1", estado: "activa" },
        { id: 3, edificioId: 1, nombre: "Recepción", piso: "1", estado: "activa" },
        { id: 4, edificioId: 2, nombre: "Apartamento 201", piso: "2", estado: "activa" },
        { id: 5, edificioId: 2, nombre: "Depósito", piso: "-1", estado: "activa" },
      ],
      items: [
        { id: 1, habitacionId: 1, nombre: "Toallas", categoria: "Lencería", cantidad: 8, minimo: 4, estado: "bueno" },
        { id: 2, habitacionId: 1, nombre: "Almohadas", categoria: "Lencería", cantidad: 4, minimo: 2, estado: "bueno" },
        { id: 3, habitacionId: 1, nombre: 'Televisor 43"', categoria: "Electrónica", cantidad: 1, minimo: 1, estado: "bueno" },
        { id: 4, habitacionId: 2, nombre: "Toallas", categoria: "Lencería", cantidad: 2, minimo: 4, estado: "regular" },
        { id: 5, habitacionId: 2, nombre: "Secador", categoria: "Electrónica", cantidad: 1, minimo: 1, estado: "bueno" },
        { id: 6, habitacionId: 3, nombre: "Resmas de papel", categoria: "Oficina", cantidad: 12, minimo: 5, estado: "bueno" },
        { id: 7, habitacionId: 4, nombre: "Sillas", categoria: "Mobiliario", cantidad: 6, minimo: 4, estado: "bueno" },
        { id: 8, habitacionId: 4, nombre: "Bombillos LED", categoria: "Mantenimiento", cantidad: 3, minimo: 6, estado: "bueno" },
        { id: 9, habitacionId: 5, nombre: "Pintura blanca (gal)", categoria: "Mantenimiento", cantidad: 9, minimo: 3, estado: "bueno" },
      ],
      movimientos: [
        { id: 1, itemId: 1, usuarioId: 1, tipo: "entrada", cantidad: 8, nota: "Registro inicial", fecha: f },
        { id: 2, itemId: 4, usuarioId: 1, tipo: "salida", cantidad: 2, nota: "Cambio de turno", fecha: f },
      ],
    };
  }

  function leer() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (crudo) return JSON.parse(crudo);
    } catch (_) { /* almacenamiento bloqueado o dato corrupto */ }
    const inicial = semilla();
    guardar(inicial);
    return inicial;
  }

  function guardar(estado) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (_) {
      console.warn("Listaro no pudo guardar en este navegador.");
    }
  }

  function reiniciar() {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_SESION);
  }

  /* ---------------------------------------------------- sesión */
  function usuarioActual() {
    const id = Number(localStorage.getItem(CLAVE_SESION));
    if (!id) return null;
    return leer().usuarios.find((u) => u.id === id) || null;
  }

  function entrar(correo, clave) {
    const u = leer().usuarios.find(
      (x) => x.correo === correo.trim().toLowerCase() && x.clave === clave
    );
    if (!u) throw new Error("Correo o contraseña incorrectos.");
    localStorage.setItem(CLAVE_SESION, String(u.id));
    return u;
  }

  function registrar({ nombre, correo, clave, confirmar }) {
    correo = (correo || "").trim().toLowerCase();
    nombre = (nombre || "").trim();

    if (!nombre || !correo || !clave) throw new Error("Completa todos los campos.");
    if (!correo.includes("@")) throw new Error("Escribe un correo válido.");
    if (clave.length < 8) throw new Error("La contraseña necesita al menos 8 caracteres.");
    if (clave !== confirmar) throw new Error("Las contraseñas no coinciden.");

    const estado = leer();
    if (estado.usuarios.some((u) => u.correo === correo)) {
      throw new Error("Ese correo ya tiene una cuenta. Inicia sesión.");
    }

    const usuario = { id: nuevoId(estado.usuarios), nombre, correo, clave };
    estado.usuarios.push(usuario);
    guardar(estado);
    localStorage.setItem(CLAVE_SESION, String(usuario.id));
    return usuario;
  }

  function salir() {
    localStorage.removeItem(CLAVE_SESION);
  }

  function exigirSesion() {
    const u = usuarioActual();
    if (!u) {
      window.location.href = "login.html";
      return null;
    }
    return u;
  }

  /* ---------------------------------------------------- consultas */
  function edificiosDe(usuarioId) {
    const e = leer();
    return e.edificios
      .filter((x) => x.usuarioId === usuarioId)
      .map((ed) => {
        const habs = e.habitaciones.filter((h) => h.edificioId === ed.id);
        const ids = habs.map((h) => h.id);
        const items = e.items.filter((i) => ids.includes(i.habitacionId));
        return {
          ...ed,
          habitaciones: habs.length,
          unidades: items.reduce((s, i) => s + i.cantidad, 0),
          alertas: items.filter((i) => i.cantidad < i.minimo).length,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  function edificio(id, usuarioId) {
    return leer().edificios.find((x) => x.id === id && x.usuarioId === usuarioId) || null;
  }

  function habitacionesDe(edificioId) {
    const e = leer();
    return e.habitaciones
      .filter((h) => h.edificioId === edificioId)
      .map((h) => {
        const items = e.items.filter((i) => i.habitacionId === h.id);
        return {
          ...h,
          items: items.length,
          unidades: items.reduce((s, i) => s + i.cantidad, 0),
          alertas: items.filter((i) => i.cantidad < i.minimo).length,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  function habitacion(id, usuarioId) {
    const e = leer();
    const h = e.habitaciones.find((x) => x.id === id);
    if (!h) return null;
    const ed = e.edificios.find((x) => x.id === h.edificioId);
    if (!ed || ed.usuarioId !== usuarioId) return null;
    return { ...h, edificioId: ed.id, edificioNombre: ed.nombre };
  }

  function itemsDe(habitacionId) {
    return leer().items
      .filter((i) => i.habitacionId === habitacionId)
      .sort((a, b) => (a.categoria + a.nombre).localeCompare(b.categoria + b.nombre));
  }

  function movimientosDe(habitacionId) {
    const e = leer();
    const ids = e.items.filter((i) => i.habitacionId === habitacionId).map((i) => i.id);
    return e.movimientos
      .filter((m) => ids.includes(m.itemId))
      .map((m) => ({ ...m, itemNombre: (e.items.find((i) => i.id === m.itemId) || {}).nombre }))
      .sort((a, b) => b.id - a.id)
      .slice(0, 12);
  }

  function resumen(usuarioId) {
    const lista = edificiosDe(usuarioId);
    return {
      edificios: lista.length,
      habitaciones: lista.reduce((s, x) => s + x.habitaciones, 0),
      unidades: lista.reduce((s, x) => s + x.unidades, 0),
      alertas: lista.reduce((s, x) => s + x.alertas, 0),
    };
  }

  /* ---------------------------------------------------- escrituras */
  function crearEdificio(usuarioId, { nombre, direccion, notas }) {
    nombre = (nombre || "").trim();
    if (!nombre) throw new Error("El edificio necesita un nombre.");
    const e = leer();
    const ed = {
      id: nuevoId(e.edificios), usuarioId, nombre,
      direccion: (direccion || "").trim(), notas: (notas || "").trim(),
    };
    e.edificios.push(ed);
    guardar(e);
    return ed;
  }

  function crearHabitacion(edificioId, { nombre, piso, estado }) {
    nombre = (nombre || "").trim();
    if (!nombre) throw new Error("La habitación necesita un nombre.");
    const e = leer();
    const h = {
      id: nuevoId(e.habitaciones), edificioId, nombre,
      piso: (piso || "").trim(), estado: estado || "activa",
    };
    e.habitaciones.push(h);
    guardar(e);
    return h;
  }

  function crearItem(habitacionId, datos) {
    const nombre = (datos.nombre || "").trim();
    if (!nombre) throw new Error("El artículo necesita un nombre.");

    const cantidad = Number(datos.cantidad) || 0;
    const minimo = Number(datos.minimo) || 0;
    if (cantidad < 0 || minimo < 0) {
      throw new Error("Cantidad y mínimo no pueden ser negativos.");
    }

    const e = leer();
    const item = {
      id: nuevoId(e.items), habitacionId, nombre,
      categoria: (datos.categoria || "General").trim(),
      cantidad, minimo, estado: datos.estado || "bueno",
    };
    e.items.push(item);

    if (cantidad > 0) {
      e.movimientos.push({
        id: nuevoId(e.movimientos), itemId: item.id,
        usuarioId: Number(localStorage.getItem(CLAVE_SESION)),
        tipo: "entrada", cantidad, nota: "Registro inicial", fecha: ahora(),
      });
    }
    guardar(e);
    return item;
  }

  function registrarMovimiento(itemId, tipo, cantidad, nota = "") {
    if (tipo !== "entrada" && tipo !== "salida") {
      throw new Error("El movimiento debe ser entrada o salida.");
    }
    cantidad = Number(cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error("Registra una cantidad mayor que cero.");
    }

    const e = leer();
    const item = e.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Ese artículo ya no existe.");

    const nueva = tipo === "entrada" ? item.cantidad + cantidad : item.cantidad - cantidad;
    if (nueva < 0) {
      throw new Error(`Solo quedan ${item.cantidad} unidades de ${item.nombre}.`);
    }

    item.cantidad = nueva;
    e.movimientos.push({
      id: nuevoId(e.movimientos), itemId, tipo, cantidad, nota,
      usuarioId: Number(localStorage.getItem(CLAVE_SESION)), fecha: ahora(),
    });
    guardar(e);
    return { cantidad: nueva, bajoMinimo: nueva < item.minimo };
  }

  function borrarItem(itemId) {
    const e = leer();
    e.items = e.items.filter((i) => i.id !== itemId);
    e.movimientos = e.movimientos.filter((m) => m.itemId !== itemId);
    guardar(e);
  }

  return {
    usuarioActual, entrar, registrar, salir, exigirSesion, reiniciar,
    edificiosDe, edificio, habitacionesDe, habitacion, itemsDe,
    movimientosDe, resumen,
    crearEdificio, crearHabitacion, crearItem, registrarMovimiento, borrarItem,
  };
})();
