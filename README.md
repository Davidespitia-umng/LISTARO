# LISTARO
# Listaro — versión web

Sitio de gestión de inventario por **edificio → habitación → artículo**, hecho
solo con HTML, CSS y JavaScript. No necesita servidor ni instalar nada.

## Cómo abrirlo

1. Abre la carpeta `listaro-web` en Visual Studio Code.
2. Clic derecho sobre `index.html` → **Open with Live Server**.
   (O simplemente haz doble clic en `index.html`; también funciona.)

Esta vez sí puedes usar Live Server: ya no hay plantillas de Jinja, son
archivos `.html` normales.

## Cuenta de prueba

| Correo | Contraseña |
|---|---|
| `demo@listaro.co` | `demo1234` |

Viene con dos edificios (Hotel Central y Edificio Norte), sus habitaciones y
artículos ya cargados. También puedes crear tu propia cuenta desde
`registro.html`.

## Archivos

```
listaro-web/
├── index.html         # Landing page
├── login.html         # Iniciar sesión
├── registro.html      # Crear cuenta
├── panel.html         # Mis edificios
├── edificio.html      # Habitaciones de un edificio  (edificio.html?id=1)
├── habitacion.html    # Inventario y movimientos     (habitacion.html?id=1)
├── css/
│   └── styles.css     # Tema oscuro con acento naranja
└── js/
    ├── datos.js       # Almacén: cuentas, edificios, habitaciones, artículos
    └── app.js         # Interfaz: navegación, modales y pintado de pantallas
```

## Dónde se guardan los datos

En el `localStorage` del navegador, con la clave `listaro:datos`. Eso significa:

- Los cambios se conservan aunque cierres la pestaña.
- Cada navegador tiene su propia copia; no se comparte entre computadores.
- Borrar el historial o los datos del sitio borra el inventario.

Para volver al estado inicial, abre la consola del navegador (`F12`) y escribe:

```js
Datos.reiniciar(); location.reload();
```

## Nota para la sustentación

Las contraseñas se guardan en texto plano dentro del navegador porque no hay
servidor: esta versión es una **maqueta funcional** para demostrar los flujos de
la interfaz. En una versión real, el registro, el inicio de sesión y el
inventario irían en un backend con base de datos y contraseñas cifradas.
