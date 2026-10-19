# Esquema del archivo JSON

El archivo `ejemplo.json` contiene los resultados obtenidos por el script
`auditor-acceso-remoto.ps1`.

## equipo
Nombre del equipo Windows donde se ejecutó la auditoría.

## fecha
Fecha y hora en que se realizó la auditoría.

## servicios
Contiene los servicios de acceso remoto analizados.

### RDP
- `servicio`: nombre del servicio.
- `habilitado`: indica si RDP se encuentra activo.
- `puerto`: puerto utilizado por RDP.
- `autenticacion`: indica el estado de Network Level Authentication (NLA).

### WinRM
- `servicio`: nombre del servicio.
- `habilitado`: indica si WinRM se encuentra activo.
- `puerto`: puertos utilizados para HTTP y HTTPS.
- `autenticacion`: configuración de autenticación detectada.

### OpenSSH
- `servicio`: nombre del servicio.
- `habilitado`: indica si el servicio SSH se encuentra activo.
- `puerto`: puerto utilizado por SSH.
- `autenticacion`: configuración de autenticación detectada.

## firewall
Muestra el estado de los perfiles del Firewall de Windows:

- Domain
- Private
- Public

El valor `1` indica que el perfil se encuentra habilitado.