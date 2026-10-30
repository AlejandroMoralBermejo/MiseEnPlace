# Diseño de MiseEnPlace

Referencia del rediseño "Petróleo". El criterio general es **simple y funcional**: sin decoración ni emojis, y una sola acción clara por pantalla.

- **Lienzo original:** [MiseEnPlace rediseño](https://claude.ai/artifact/9qQCLDFNPrMwtAH27hMdEC) (privado, solo lo abre su propietario).
- **Maquetas:** carpeta [`boards/`](boards/). Son copias del lienzo con contenido de ejemplo. Usan el formato `.dc.html` del editor, así que no se abren como páginas normales.
- **Fuente de verdad:** el código. Los colores viven en `src/app/globals.css`; si difieren de este documento, manda el código.

## Paleta

| Función | Token | Color |
|---|---|---|
| Fondo | `ground` | `#0F3440` |
| Superficie | `surface` | `#17444F` |
| Texto | `ink` | `#F2F2E8` |
| Texto secundario | `muted` | `#C4D6D8` |
| Línea | `line` | `#62919B` |
| Principal | `primary` | `#F2B632` |
| Texto sobre principal | `on-primary` | `#0F3440` |
| Acento | `accent` | `#F7C873` |
| Error | `danger` | `#FFB3A8` |
| Éxito | `success` | `#A5E2C0` |

El contraste se calculó al elegir la paleta: al menos 4,5:1 en texto y 3:1 en líneas.

### Tipos de comida

Siempre con texto `#0F3440`.

| Tipo | Token | Color |
|---|---|---|
| Desayuno | `meal-1` | `#F2B632` |
| Comida | `meal-2` | `#F2AE93` |
| Cena | `meal-3` | `#A5D0E6` |
| Merienda | `meal-4` | `#BFE3B4` |
| Snack | `meal-5` | `#E2BBD6` |

## Tipografía

- **Títulos:** Bricolage Grotesque.
- **Texto e interfaz:** Figtree.

## Logo

"En su sitio": cuatro casillas, tres en `line` y una en `primary`. Representa cada cosa en su lugar.

Los iconos de la app se regeneran con `node scripts/generate-icons.mjs`. El dibujo está en `src/components/Icons.tsx` y `src/app/icon.svg`.

## Pautas

- **Tamaño táctil:** 44 px como mínimo.
- **Editar:** se toca la fila o la tarjeta.
- **Eliminar:** siempre pide confirmación.
- **Vocabulario:** "Añadir", no "Agregar".
- **Vista de escritorio:** a partir de 1024 px (`lg`).

## Pantallas

| Maqueta | Pantalla |
|---|---|
| `Main.dc.html` | Paleta |
| `Logo.dc.html` | Propuestas de logo (elegida: C) |
| `CalendarioMovil.dc.html`, `CalendarioEscritorio.dc.html` | Calendario, semana |
| `MesMovil.dc.html`, `MesEscritorio.dc.html` | Calendario, mes |
| `FormularioComida.dc.html` | Formulario de comida |
| `InventarioMovil.dc.html`, `InventarioEscritorio.dc.html` | Inventario |
| `ComprasMovil.dc.html`, `ComprasEscritorio.dc.html` | Compras |
| `Login.dc.html` | Inicio de sesión |

## Diferencias con la app

- **Añadir en móvil:** en Calendario (semana) e Inventario, el botón queda fijo sobre la barra inferior.
- **Mes en escritorio:** se añade una comida pulsando el número del día.
- **Logo:** las maquetas de pantallas no lo muestran, porque se eligió después.

## Decisiones de producto

- No hay registro ni recuperación de contraseña: las cuentas se gestionan en Supabase.
