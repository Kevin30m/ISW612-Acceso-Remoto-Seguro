const inputArchivo = document.getElementById("archivoJSON");

const equipoElemento = document.getElementById("equipo");
const fechaElemento = document.getElementById("fecha");
const serviciosElemento = document.getElementById("servicios");
const politicaElemento = document.getElementById("politicaBloqueo");
const firewallElemento = document.getElementById("firewall");
const recomendacionesElemento = document.getElementById("recomendaciones");
const puntajeElemento = document.getElementById("puntaje");

inputArchivo.addEventListener("change", function (event) {

    const archivo = event.target.files[0];

    if (!archivo) {
        return;
    }

    const lector = new FileReader();

    lector.onload = function (e) {

        try {

            const datos = JSON.parse(e.target.result);

            mostrarInformacion(datos);
            mostrarServicios(datos.servicios);
            mostrarPoliticaBloqueo(datos.politica_bloqueo);
            mostrarFirewall(datos.firewall);

            const resultado = calcularPuntaje(datos);

            mostrarPuntaje(resultado.puntaje);
            mostrarRecomendaciones(resultado.recomendaciones);

        } catch (error) {

            alert("El archivo seleccionado no contiene un JSON válido.");

            console.error(error);
        }
    };

    lector.readAsText(archivo);
});


function mostrarInformacion(datos) {

    equipoElemento.textContent = datos.equipo || "No disponible";

    fechaElemento.textContent = datos.fecha || "No disponible";
}


function mostrarServicios(servicios) {

    serviciosElemento.innerHTML = "";

    if (!servicios || servicios.length === 0) {

        serviciosElemento.innerHTML =
            "<p>No hay información de servicios.</p>";

        return;
    }

    servicios.forEach(function (servicio) {

        const contenedor = document.createElement("div");

        contenedor.classList.add("servicio");

        let estadoTexto;

        if (servicio.habilitado) {

            estadoTexto =
                '<span class="estado-seguro">Habilitado</span>';

        } else {

            estadoTexto =
                '<span class="estado-riesgo">Deshabilitado</span>';
        }

        contenedor.innerHTML = `
            <h3>${servicio.servicio}</h3>

            <p>
                <strong>Estado:</strong>
                ${estadoTexto}
            </p>

            <p>
                <strong>Puerto:</strong>
                ${servicio.puerto}
            </p>

            <p>
                <strong>Autenticación:</strong>
                ${servicio.autenticacion}
            </p>
        `;

        serviciosElemento.appendChild(contenedor);
    });
}


function mostrarPoliticaBloqueo(politica) {

    if (!politica) {

        politicaElemento.innerHTML =
            "<p>No se encontró información.</p>";

        return;
    }

    politicaElemento.innerHTML = `
        <p>
            <strong>Umbral de bloqueo:</strong>
            ${politica.umbral_bloqueo}
        </p>

        <p>
            <strong>Duración del bloqueo:</strong>
            ${politica.duracion_bloqueo_minutos} minutos
        </p>

        <p>
            <strong>Ventana de observación:</strong>
            ${politica.ventana_observacion_minutos} minutos
        </p>
    `;
}


function mostrarFirewall(firewall) {

    firewallElemento.innerHTML = "";

    if (!firewall || firewall.length === 0) {

        firewallElemento.innerHTML =
            "<p>No hay información del firewall.</p>";

        return;
    }

    firewall.forEach(function (perfil) {

        const estado = perfil.habilitado
            ? '<span class="estado-seguro">Habilitado</span>'
            : '<span class="estado-riesgo">Deshabilitado</span>';

        firewallElemento.innerHTML += `
            <p>
                <strong>${perfil.nombre}:</strong>
                ${estado}
            </p>
        `;
    });
}


function calcularPuntaje(datos) {

    let puntaje = 0;

    const recomendaciones = [];

    const rdp = datos.servicios.find(
        servicio => servicio.servicio === "RDP"
    );

    const winrm = datos.servicios.find(
        servicio => servicio.servicio === "WinRM"
    );

    const ssh = datos.servicios.find(
        servicio => servicio.servicio === "OpenSSH"
    );


    // ---------------------------------
    // RDP + NLA
    // Máximo: 25 puntos
    // ---------------------------------

    if (rdp) {

        if (
            rdp.autenticacion &&
            rdp.autenticacion.includes("NLA habilitado")
        ) {

            puntaje += 25;

        } else {

            recomendaciones.push(
                "Habilitar NLA para mejorar la seguridad de RDP."
            );
        }
    }


    // ---------------------------------
    // Firewall
    // Máximo: 25 puntos
    // ---------------------------------

    if (datos.firewall) {

        const perfilesActivos =
            datos.firewall.filter(
                perfil => perfil.habilitado === true
            ).length;

        if (perfilesActivos === 3) {

            puntaje += 25;

        } else {

            recomendaciones.push(
                "Mantener habilitados todos los perfiles del Firewall de Windows."
            );
        }
    }


    // ---------------------------------
    // Política de bloqueo
    // Máximo: 30 puntos
    // ---------------------------------

    if (datos.politica_bloqueo) {

        if (
            datos.politica_bloqueo.umbral_bloqueo !== "Nunca"
        ) {

            puntaje += 30;

        } else {

            recomendaciones.push(
                "Configurar un umbral de bloqueo de cuenta después de varios intentos fallidos."
            );
        }
    }


    // ---------------------------------
    // Servicios innecesarios
    // Máximo: 20 puntos
    // ---------------------------------

    if (winrm && !winrm.habilitado) {

        puntaje += 10;

    } else if (winrm && winrm.habilitado) {

        recomendaciones.push(
            "Revisar la configuración de WinRM y mantenerlo habilitado solo si es necesario."
        );
    }


    if (ssh && !ssh.habilitado) {

        puntaje += 10;

    } else if (ssh && ssh.habilitado) {

        recomendaciones.push(
            "Revisar la configuración de OpenSSH y utilizar autenticación segura."
        );
    }


    return {
        puntaje: puntaje,
        recomendaciones: recomendaciones
    };
}


function mostrarPuntaje(puntaje) {

    puntajeElemento.textContent = `${puntaje} / 100`;

    if (puntaje >= 80) {

        puntajeElemento.style.backgroundColor = "#d4edda";

    } else if (puntaje >= 50) {

        puntajeElemento.style.backgroundColor = "#fff3cd";

    } else {

        puntajeElemento.style.backgroundColor = "#f8d7da";
    }
}


function mostrarRecomendaciones(recomendaciones) {

    recomendacionesElemento.innerHTML = "";

    if (recomendaciones.length === 0) {

        recomendacionesElemento.innerHTML =
            '<p class="estado-seguro">No se detectaron recomendaciones críticas.</p>';

        return;
    }

    recomendaciones.forEach(function (texto) {

        const elemento = document.createElement("div");

        elemento.classList.add("recomendacion");

        elemento.textContent = texto;

        recomendacionesElemento.appendChild(elemento);
    });
}