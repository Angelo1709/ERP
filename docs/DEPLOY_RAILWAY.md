# Deploy en Railway (API + MySQL)

Esta guia deja tu ERP multiusuario con una API central en la nube.

## 1) Preparar repo en GitHub

Desde la raiz del proyecto:

```bash
git add .
git commit -m "prepare railway deployment"
git push
```

## 2) Crear proyecto en Railway

1. En Railway, crear `New Project`.
2. Elegir `Deploy from GitHub Repo`.
3. Seleccionar este repo.
4. Railway detecta `Dockerfile` y deploya la API.

## 3) Agregar MySQL en Railway

1. En el mismo proyecto: `New` -> `Database` -> `MySQL`.
2. Esperar que termine el aprovisionamiento.

## 4) Variables de entorno en el servicio API

En `Variables` del servicio API, cargar:

```env
ERP_STORAGE=mysql
HOST=0.0.0.0
CORS_ORIGIN=*
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}
```

Nota: Railway suele exponer tambien `MYSQL_URL`; tu API usa variables separadas y es correcto.

## 5) Verificar salud

Abrir en navegador:

```text
https://TU_API_PUBLIC_URL/api/health
```

Debe devolver `ok: true` y `storage: "mysql"`.

## 6) Pasar datos actuales a Railway (si ya tenias datos locales)

Opcion recomendada:
1. Exportar backup local:

```bash
npm run backup:state
```

2. Restaurar en Railway:
   - Descarga el JSON de `backups/`.
   - En una maquina donde tengas acceso a la DB Railway, cargar variables `MYSQL_*` de Railway.
   - Ejecutar:

```bash
npm run restore:state -- backups/state-backup-YYYYMMDD-HHMMSS.json
```

## 7) Clientes (PCs / web / movil)

Todos deben apuntar a la misma API en Railway:

- `https://TU_API_PUBLIC_URL/api/health`
- `https://TU_API_PUBLIC_URL/live/operaciones.csv`

Para frontend web compilado, usar `VITE_API_BASE_URL=https://TU_API_PUBLIC_URL`.

## 8) Backup operativo (recomendado)

Hacer backup diario:

```bash
npm run backup:state
```

Guardar los JSON en otra ubicacion (Drive, OneDrive o S3).

## 9) Salida futura de Railway (portabilidad)

No hay lock-in fuerte:
- App: Node.js estandar
- DB: MySQL estandar
- Backup: JSON completo del estado

Para migrar a otro proveedor:
1. Levantar nueva API Node.
2. Crear MySQL.
3. Configurar variables `MYSQL_*`.
4. `npm run restore:state -- <backup.json>`.
