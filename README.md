# ISW612 - Acceso Remoto Seguro

Proyecto de investigación del curso **ISW-612 Administración de Sistemas Operativos de Red**.

## Tema

**Tema 6: Acceso remoto seguro mediante RDP, WinRM y OpenSSH en Windows.**

## Integrantes

- Kevin Urbina Reyes


---

## Objetivo del proyecto

Evaluar la configuración de los servicios de acceso remoto en Windows y determinar qué medidas de endurecimiento ayudan a reducir el riesgo de ataques de fuerza bruta.

El proyecto analiza:

- RDP
- Network Level Authentication (NLA)
- WinRM
- OpenSSH
- Firewall de Windows
- Política de bloqueo de cuentas

---

## Arquitectura del proyecto

El proyecto se divide en tres componentes principales:

1. **Script PowerShell**
   - Audita la configuración del equipo Windows.
   - Revisa RDP, NLA, WinRM, OpenSSH, Firewall y política de bloqueo.
   - Genera un archivo JSON con los resultados.

2. **Archivo JSON**
   - Contiene los resultados obtenidos por el script.
   - Sirve como entrada para la aplicación web.

3. **Aplicación web**
   - Permite cargar un archivo JSON.
   - Muestra la configuración detectada.
   - Calcula un puntaje de seguridad de 0 a 100.
   - Presenta recomendaciones de endurecimiento.

Flujo general:

```text
Windows
   ↓
Script PowerShell
   ↓
Archivo JSON
   ↓
Aplicación web
   ↓
Puntaje y recomendaciones