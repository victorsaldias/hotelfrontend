const API_URL = "https://hotelbackend-hzc4.onrender.com/api/limpieza/habitaciones";

function obtenerEmpleadoActual() {
    const empleadoId = localStorage.getItem('empleadoId');
    const empleadoNombre = localStorage.getItem('empleadoNombre');
    const empleadoApellido = localStorage.getItem('empleadoApellido');
    const empleadoIdSucursal = localStorage.getItem('empleadoIdSucursal'); 
    
    if (!empleadoId) { 
        Swal.fire({
            icon: 'warning',
            title: 'Sesión no válida',
            text: 'Por favor inicia sesión nuevamente'
        }).then(() => {
            window.location.href = 'login-aseo.html';
        });
        return null;
    }
    
    return {
        id: parseInt(empleadoId),
        nombre: empleadoNombre,
        apellido: empleadoApellido,
        nombreCompleto: `${empleadoNombre} ${empleadoApellido}`,
        idSucursal: empleadoIdSucursal ? parseInt(empleadoIdSucursal) : null 
    };
}

function mostrarNombreEmpleado() {
    const empleado = obtenerEmpleadoActual();
    if (empleado) {
        const headerNombre = document.getElementById('aseoNombreHeader');
        if (headerNombre) {
            headerNombre.textContent = empleado.nombreCompleto;
        }
    }
}

async function cargarHabitaciones() {
    try {
        console.log("🔄 Cargando habitaciones...");
        
        const empleado = obtenerEmpleadoActual(); 
        if (!empleado) return;
        
       
        const url = `${API_URL}?idSucursal=${empleado.idSucursal}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.success) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las habitaciones'
            });
            return;
        }

        const contenedor = document.getElementById("listaHabitaciones");
        contenedor.innerHTML = "";

        
        if (data.habitaciones.length === 0) {
            contenedor.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem;">
                        <i class="fa-solid fa-info-circle"></i> 
                        No hay habitaciones asignadas a tu sucursal
                    </td>
                </tr>
            `;
            return;
        }

        data.habitaciones.forEach(h => {
            const fila = document.createElement('tr');
            
            let botones = '';
            
            if (h.estadoLimpieza === 'Requiere aseo') {
                botones = `<button class="btn btn-primary" onclick="iniciarLimpieza(${h.idHabitacion}, '${h.numero}')">
                    <i class="fa-solid fa-play"></i> Iniciar Limpieza
                </button>`;
            } else if (h.estadoLimpieza === 'En limpieza') {
                botones = `<button class="btn btn-success" onclick="terminarLimpieza(${h.idHabitacion}, '${h.numero}')">
                    <i class="fa-solid fa-check"></i> Terminar Limpieza
                </button>`;
            } else if (h.estadoLimpieza === 'Limpia') {
                botones = `<span class="badge-success"><i class="fa-solid fa-check-circle"></i> Limpia</span>`;
            } else {
                botones = `<span class="badge-neutral">Sin registro</span>`;
            }
            
            fila.innerHTML = `
    <td data-label="Número">${h.numero}</td>
    <td data-label="Descripción">${h.descripcion}</td>
    <td data-label="Estado">${h.estadoLimpieza || "Sin registro"}</td>
    <td data-label="Acción">${botones}</td>
`;

            
            contenedor.appendChild(fila);
        });

        console.log(`✅ ${data.habitaciones.length} habitaciones cargadas (Sucursal ${empleado.idSucursal})`);

    } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor'
        });
    }
}

async function iniciarLimpieza(idHabitacion, numeroHabitacion) {
    const empleado = obtenerEmpleadoActual();
    if (!empleado) return;

    const result = await Swal.fire({
        title: `¿Iniciar limpieza?`,
        text: `Habitación ${numeroHabitacion}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: '<i class="fa-solid fa-play"></i> Sí, iniciar',
        cancelButtonText: '<i class="fa-solid fa-times"></i> Cancelar'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
        title: 'Iniciando limpieza...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const res = await fetch(`https://hotelbackend-hzc4.onrender.com/api/limpieza/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idHabitacion: idHabitacion,
                idEmpleado: empleado.id, 
                descripcion: 'Limpieza en progreso'
            })
        });

        const data = await res.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Limpieza iniciada!',
                text: `Habitación ${numeroHabitacion} - ${empleado.nombreCompleto}`,
                timer: 2000,
                showConfirmButton: false
            });
            cargarHabitaciones();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo iniciar la limpieza'
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor'
        });
    }
}

async function terminarLimpieza(idHabitacion, numeroHabitacion) {
    const empleado = obtenerEmpleadoActual();
    if (!empleado) return;

    const result = await Swal.fire({
        title: `¿Terminar limpieza?`,
        text: `Habitación ${numeroHabitacion}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: '<i class="fa-solid fa-check"></i> Sí, terminar',
        cancelButtonText: '<i class="fa-solid fa-times"></i> Cancelar'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
        title: 'Finalizando limpieza...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const res = await fetch(`https://hotelbackend-hzc4.onrender.com/api/limpieza/terminar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idHabitacion: idHabitacion,
                idEmpleado: empleado.id, 
                descripcion: 'Limpieza completada'
            })
        });

        const data = await res.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Limpieza completada!',
                text: `Habitación ${numeroHabitacion} lista - ${empleado.nombreCompleto}`,
                timer: 2000,
                showConfirmButton: false
            });
            cargarHabitaciones();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo terminar la limpieza'
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    mostrarNombreEmpleado();
    cargarHabitaciones();
});

function cerrarSesion() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('empleadoId');
            localStorage.removeItem('empleadoNombre');
            localStorage.removeItem('empleadoApellido');
            localStorage.removeItem('empleadoRol');
            localStorage.removeItem('empleadoIdSucursal'); 
            
            window.location.href = "login-aseo.html";
        }
    });
}