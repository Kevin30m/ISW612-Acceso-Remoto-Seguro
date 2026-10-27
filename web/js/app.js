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


// =====================================================
// INFORMACIÓN GENERAL DEL EQUIPO
// =====================================================

function mostrarInformacion(datos) {

    equipoElemento.textContent =
        datos.equipo || "No disponible";

    fechaElemento.textContent =
        datos.fecha || "No disponible";
}


// =====================================================
// SERVICIOS DE ACCESO REMOTO
// =====================================================

function mostrarServicios(servicios) {

    serviciosElemento.innerHTML = "";

    if (!servicios || servicios.length === 0) {

        serviciosElemento.innerHTML =
            "<p>No hay información de servicios.</p>";

        return;
    }

    servicios.forEach(function (servicio) {

        const contenedor =
            document.createElement("div");

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


// =====================================================
// POLÍTICA DE BLOQUEO
// =====================================================

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


// =====================================================
// FIREWALL
// =====================================================

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


// =====================================================
// CÁLCULO DEL PUNTAJE
// =====================================================

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


    // =====================================================
    // 1. RDP + NLA
    // Máximo: 25 puntos
    // =====================================================

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


    // =====================================================
    // 2. FIREWALL DE WINDOWS
    // Máximo: 25 puntos
    // =====================================================

    if (datos.firewall) {

        const perfilesActivos =
            datos.firewall.filter(
                perfil => perfil.habilitado === true
            ).length;


        if (perfilesActivos === 3) {

            puntaje += 25;

        } else {

            puntaje += perfilesActivos * 8;

            recomendaciones.push(
                "Mantener habilitados los perfiles Domain, Private y Public del Firewall de Windows."
            );
        }
    }


    // =====================================================
    // 3. POLÍTICA DE BLOQUEO
    // Máximo: 30 puntos
    // =====================================================

    if (datos.politica_bloqueo) {

        const politica =
            datos.politica_bloqueo;


        const umbral =
            parseInt(
                politica.umbral_bloqueo
            );


        const duracion =
            parseInt(
                politica.duracion_bloqueo_minutos
            );


        const ventana =
            parseInt(
                politica.ventana_observacion_minutos
            );


        // -------------------------------------------------
        // UMBRAL DE BLOQUEO
        // Máximo: 15 puntos
        // -------------------------------------------------

        if (
            politica.umbral_bloqueo === "Nunca" ||
            isNaN(umbral)
        ) {

            recomendaciones.push(
                "Configurar un umbral de bloqueo para limitar los intentos fallidos."
            );

        } else if (umbral <= 5) {

            puntaje += 15;

        } else if (umbral <= 10) {

            puntaje += 8;

            recomendaciones.push(
                "Reducir el umbral de bloqueo a 5 intentos para aumentar la protección contra fuerza bruta."
            );

        } else {

            puntaje += 4;

            recomendaciones.push(
                "El umbral de bloqueo es alto. Se recomienda reducir la cantidad de intentos permitidos."
            );
        }


        // -------------------------------------------------
        // DURACIÓN DEL BLOQUEO
        // Máximo: 10 puntos
        // -------------------------------------------------

        if (!isNaN(duracion)) {

            if (duracion >= 15) {

                puntaje += 10;

            } else if (duracion >= 10) {

                puntaje += 5;

                recomendaciones.push(
                    "Aumentar la duración del bloqueo a por lo menos 15 minutos."
                );

            } else {

                recomendaciones.push(
                    "La duración del bloqueo es baja. Se recomienda aumentar el tiempo de bloqueo."
                );
            }
        }


        // -------------------------------------------------
        // VENTANA DE OBSERVACIÓN
        // Máximo: 5 puntos
        // -------------------------------------------------

        if (
            !isNaN(ventana) &&
            ventana <= 15
        ) {

            puntaje += 5;

        } else {

            recomendaciones.push(
                "Revisar la ventana de observación de intentos fallidos."
            );
        }


    } else {

        recomendaciones.push(
            "No se encontró información sobre la política de bloqueo."
        );
    }


    // =====================================================
    // 4. SERVICIOS DE ACCESO REMOTO
    // Máximo: 20 puntos
    // =====================================================


    // -----------------------------------------------------
    // WinRM
    // Máximo: 10 puntos
    // -----------------------------------------------------

    if (winrm && !winrm.habilitado) {

        puntaje += 10;

    } else if (winrm && winrm.habilitado) {

        recomendaciones.push(
            "Revisar la configuración de WinRM y mantenerlo habilitado solo cuando sea necesario."
        );
    }


    // -----------------------------------------------------
    // OpenSSH
    // Máximo: 10 puntos
    // -----------------------------------------------------

    if (ssh && !ssh.habilitado) {

        puntaje += 10;

    } else if (ssh && ssh.habilitado) {

        recomendaciones.push(
            "Revisar OpenSSH y utilizar mecanismos de autenticación seguros."
        );
    }


    // =====================================================
    // EVITAR PUNTAJES MAYORES A 100
    // =====================================================

    if (puntaje > 100) {

        puntaje = 100;
    }


    return {

        puntaje: puntaje,

        recomendaciones: recomendaciones
    };
}


// =====================================================
// MOSTRAR PUNTAJE
// =====================================================

function mostrarPuntaje(puntaje) {

    puntajeElemento.textContent =
        `${puntaje} / 100`;


    if (puntaje >= 80) {

        puntajeElemento.style.backgroundColor =
            "#d4edda";

    } else if (puntaje >= 50) {

        puntajeElemento.style.backgroundColor =
            "#fff3cd";

    } else {

        puntajeElemento.style.backgroundColor =
            "#f8d7da";
    }
}


// =====================================================
// MOSTRAR RECOMENDACIONES
// =====================================================

function mostrarRecomendaciones(recomendaciones) {

    recomendacionesElemento.innerHTML = "";


    if (recomendaciones.length === 0) {

        recomendacionesElemento.innerHTML =
            '<p class="estado-seguro">No se detectaron recomendaciones críticas.</p>';

        return;
    }


    recomendaciones.forEach(function (texto) {

        const elemento =
            document.createElement("div");

        elemento.classList.add(
            "recomendacion"
        );

        elemento.textContent =
            texto;

        recomendacionesElemento.appendChild(
            elemento
        );
    });
}