# LDS AGRO ERP

## Levantar app + API

```bash
npm run dev
```

Esto inicia:
- Frontend Vite (ejemplo `http://localhost:5117`)
- API local (siempre en `http://localhost:4000`)

## Excel en tiempo real

La API genera CSV vivos en `data/live` y además expone endpoints web para Excel/Power BI.

### Endpoints utiles

- Salud API: `http://localhost:4000/api/health`
- Tablas para Power BI: `http://localhost:4000/api/powerbi/tables`
- Tablas para Excel (incluye `.iqy`): `http://localhost:4000/api/excel/tables`
- CSV live ejemplo: `http://localhost:4000/live/operaciones.csv`
- IQY ejemplo: `http://localhost:4000/api/excel/query/operaciones.iqy`

### Opcion A (rapida): abrir IQY

1. Abri en navegador `http://localhost:4000/api/excel/query/operaciones.iqy`
2. Descarga el archivo y abrilo con Excel.
3. En Excel, habilita la conexion externa si la pide.
4. En propiedades de consulta, activa refresco automatico (por ejemplo cada 1 minuto).

### Opcion B: Power Query desde URL

1. Excel > Datos > Obtener datos > Desde Web.
2. URL: `http://localhost:4000/live/operaciones.csv`
3. Cargar.
4. En Consulta/Conexion, activar refresco cada X minutos.

## Nota importante

Si no aparecen endpoints nuevos (por ejemplo devuelve "ruta no encontrada"), hay un proceso API viejo en puerto 4000. Cerralo y vuelve a correr:

```bash
npm run dev:api
```

## MySQL (opcional, recomendado a largo plazo)

La API ahora soporta 3 modos de storage:
- `mysql` (si configuras MySQL)
- `sqlite` (fallback local cuando `node:sqlite` esta disponible)
- `json` (fallback final)

Para forzar MySQL, define estas variables antes de iniciar la API:

```powershell
$env:ERP_STORAGE="mysql"
$env:MYSQL_HOST="127.0.0.1"
$env:MYSQL_PORT="3306"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="tu_password"
$env:MYSQL_DATABASE="lds_agro_erp"
npm run dev:api
```

Validacion:
- `http://localhost:4000/api/health` debe mostrar `"storage":"mysql"`.
- Los endpoints de Excel/Power BI siguen iguales (`/live/*.csv`, `/api/excel/tables`, `/api/powerbi/tables`).

### Migrar estado actual a MySQL

1. Configura variables `MYSQL_*` (como arriba).
2. Ejecuta:

```powershell
npm run migrate:mysql
```

Ese comando toma el estado local actual (`data/app-state.json` o `data/erp.sqlite`) y lo copia a MySQL en `app_state`.

## Instalador .EXE (Windows)

Con esto puedes entregar el ERP a otra PC sin publicarlo en la web.

### 1) Instalar dependencias (una sola vez)

```bash
npm install
```

### 2) Generar instalador

```bash
npm run dist:win
```

Se genera en la carpeta `release/` un instalador `.exe` (NSIS).

### 3) Instalar en otra computadora

1. Copiar el `.exe` a la otra PC.
2. Ejecutar instalador.
3. Abrir "LDS Agro ERP".

La app queda local en esa PC y guarda datos en el perfil del usuario (carpeta de app local), sin necesidad de subir la base a internet.
