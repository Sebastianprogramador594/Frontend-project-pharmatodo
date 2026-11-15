/**
 * PHARMATODO - Gestor Global de Frontend
 * Centraliza la configuración de API, control de sesiones,
 * barra de navegación y utilidades de formato.
 */

const PharmatodoApp = (function () {
    // URL base de la API Backend
    const API_BASE_URL = "http://localhost:3000/api";

    /**
     * Obtiene el token JWT actual
     */
    function obtenerToken() {
        return localStorage.getItem("tokenPharmatodo");
    }

    /**
     * Obtiene los datos del usuario en sesión
     */
    function obtenerUsuario() {
        try {
            const data = localStorage.getItem("usuarioPharmatodo");
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Error al leer datos de usuario en sesión:", e);
            return null;
        }
    }

    /**
     * Genera los encabezados HTTP estándar con autenticación Bearer
     */
    function obtenerHeaders(extras = {}) {
        const headers = {
            "Content-Type": "application/json",
            ...extras
        };
        const token = obtenerToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    /**
     * Valida que el usuario tenga sesión activa y opcionalmente el rol requerido.
     * Si no cumple, redirige inmediatamente.
     */
    function verificarSesion(rolRequerido = null) {
        const token = obtenerToken();
        const usuario = obtenerUsuario();

        // En PantallaLogin.html no redirigimos al login si no hay sesión
        const esPaginaLogin = window.location.pathname.toLowerCase().endsWith("pantallalogin.html");

        if (!token || !usuario) {
            if (!esPaginaLogin) {
                window.location.href = "PantallaLogin.html";
            }
            return false;
        }

        if (esPaginaLogin) {
            // Si ya está logueado y abre el login, redirigir al Dashboard
            window.location.href = "Dashboard.html";
            return true;
        }

        const rolUsuario = usuario.rol || usuario.ROL;

        if (rolRequerido && rolUsuario !== rolRequerido) {
            alert(`Acceso denegado: Este módulo requiere permisos de ${rolRequerido}.`);
            window.location.href = "Dashboard.html";
            return false;
        }

        return true;
    }

    /**
     * Cierra la sesión activa y redirige a la pantalla de login
     */
    function cerrarSesion() {
        const confirmar = confirm("¿Estás seguro de que deseas cerrar sesión en Pharmatodo?");
        if (!confirmar) return;

        localStorage.removeItem("tokenPharmatodo");
        localStorage.removeItem("usuarioPharmatodo");
        window.location.href = "PantallaLogin.html";
    }

    /**
     * Formatea un número como moneda colombiana (COP)
     */
    function formatearMoneda(valor) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }).format(Number(valor) || 0);
    }

    /**
     * Formatea un número estándar con separador de miles
     */
    function formatearNumero(valor) {
        return Number(valor || 0).toLocaleString("es-CO");
    }

    /**
     * Formatea una fecha en formato es-CO (DD/MM/AAAA)
     */
    function formatearFecha(fecha) {
        if (!fecha) return "No registrada";
        const f = new Date(fecha);
        if (Number.isNaN(f.getTime())) return String(fecha);
        return f.toLocaleDateString("es-CO");
    }

    /**
     * Configura y unifica automáticamente la barra de navegación en todas las páginas:
     * - Resalta el link activo según el archivo actual
     * - Oculta o advierte sobre el módulo de usuarios para no-administradores
     * - Inserta el identificador de usuario y botón de cerrar sesión
     */
    function inicializarNavbar() {
        const navbar = document.querySelector(".navbar");
        if (!navbar) return;

        const paginaActual = window.location.pathname.split("/").pop().toLowerCase();
        const usuario = obtenerUsuario();

        // 1. Corregir y resaltar enlaces en la barra
        const links = navbar.querySelectorAll(".nav-links a");
        links.forEach(link => {
            const href = link.getAttribute("href");
            if (!href) return;

            const hrefNormalizado = href.toLowerCase();

            // Corregir nombres de archivo mal escritos
            if (hrefNormalizado === "inventario.html") {
                link.setAttribute("href", "Inventario.html");
            }
            if (href === "" || hrefNormalizado === "configuracion.html") {
                link.setAttribute("href", "Configuracion.html");
            }

            // Marcar enlace activo
            if (
                hrefNormalizado === paginaActual ||
                (paginaActual === "" && hrefNormalizado === "dashboard.html") ||
                (paginaActual === "actualizaciondeproductos.html" && hrefNormalizado === "gestiondeproductos.html")
            ) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }

            // Ocultar acceso a Usuarios si no es Administrador
            if (hrefNormalizado === "usuarios.html" && usuario) {
                const rol = usuario.rol || usuario.ROL;
                if (rol !== "Administrador") {
                    link.style.display = "none";
                }
            }
        });

        // 2. Inyectar contenedor de usuario a la derecha si no existe
        if (usuario && !navbar.querySelector(".navbar-user-section")) {
            const userSection = document.createElement("div");
            userSection.className = "navbar-user-section";
            userSection.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                margin-left: auto;
                flex-shrink: 0;
            `;

            const rol = usuario.rol || usuario.ROL || "Usuario";
            const nombre = usuario.nombre || usuario.usuario || "Personal";

            userSection.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.18); padding: 5px 12px; border-radius: 20px; font-size: 12px; color: white;">
                    <span>👤</span>
                    <span><strong>${nombre.split(" ")[0]}</strong> (${rol})</span>
                </div>
                <button type="button" onclick="PharmatodoApp.cerrarSesion()" style="background: rgba(255,255,255,0.22); border: none; color: white; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 11px; font-family: inherit; font-weight: 500; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.22)'">
                    Salir
                </button>
            `;

            navbar.appendChild(userSection);
        }
    }

    // Ejecutar inicialización al cargar el DOM
    document.addEventListener("DOMContentLoaded", () => {
        const esLogin = window.location.pathname.toLowerCase().endsWith("pantallalogin.html");
        if (!esLogin) {
            verificarSesion();
            inicializarNavbar();
        }
    });

    return {
        API_BASE_URL,
        obtenerToken,
        obtenerUsuario,
        obtenerHeaders,
        verificarSesion,
        cerrarSesion,
        formatearMoneda,
        formatearNumero,
        formatearFecha,
        inicializarNavbar
    };
})();
