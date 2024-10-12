document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dataForm');
    const calendar = document.getElementById('week');
    const clearButton = document.getElementById('clearButton');

    // Inicializar calendario
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    diasSemana.forEach(dia => {
        const diaDiv = document.createElement('div');
        diaDiv.classList.add('day');
        diaDiv.setAttribute('data-dia', dia);
        diaDiv.innerHTML = `<h3>${dia.charAt(0).toUpperCase() + dia.slice(1)}</h3>`;
        calendar.appendChild(diaDiv);
    });

    // Cargar actividades desde Local Storage
    const cargarActividades = () => {
        const data = JSON.parse(localStorage.getItem('planificador')) || { dias: {} };
        renderizarActividades(data);
    };

    const renderizarActividades = (data) => {
        const dias = data.dias;
        Object.keys(dias).forEach(key => {
            const actividades = dias[key];
            actividades.forEach(actividad => {
                const diaDiv = document.querySelector(`.day[data-dia="${key}"]`);
                const actividadDiv = document.createElement('div');
                actividadDiv.classList.add('activity');
                actividadDiv.textContent = `${actividad.hora_inicio} - ${actividad.hora_fin}: ${actividad.actividad}`;
                actividadDiv.setAttribute('data-actividad', JSON.stringify(actividad)); // Para referencia
                diaDiv.appendChild(actividadDiv);

                // Agregar eventos para eliminar actividad
                agregarEventosDeEliminacion(actividadDiv);
            });
        });
    };

    // Agregar eventos de eliminación para la actividad
    const agregarEventosDeEliminacion = (actividadDiv) => {
        actividadDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            mostrarMenuContextual(e, actividadDiv);
        });

        actividadDiv.addEventListener('touchstart', (e) => {
            e.preventDefault();
            setTimeout(() => {
                mostrarMenuContextual(e, actividadDiv);
            }, 500); // Mostrar después de 500ms
        });
    };

    const mostrarMenuContextual = (e, actividadDiv) => {
        const menu = document.createElement('div');
        menu.classList.add('context-menu');
        menu.innerHTML = '<button id="eliminarActividad">Eliminar</button>';

        // Posicionar el menú
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;
        document.body.appendChild(menu);

        const eliminarButton = document.getElementById('eliminarActividad');
        eliminarButton.addEventListener('click', () => {
            eliminarActividad(actividadDiv);
            document.body.removeChild(menu); // Eliminar menú
        });

        document.addEventListener('click', () => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        });
    };

    const eliminarActividad = (actividadDiv) => {
        const diaDiv = actividadDiv.closest('.day');
        diaDiv.removeChild(actividadDiv); // Remover del DOM

        const dia = diaDiv.getAttribute('data-dia');

        const data = JSON.parse(localStorage.getItem('planificador')) || { dias: {} };
        const actividad = JSON.parse(actividadDiv.getAttribute('data-actividad'));

        data.dias[dia] = data.dias[dia].filter(act => act.hora_inicio !== actividad.hora_inicio || act.hora_fin !== actividad.hora_fin || act.actividad !== actividad.actividad);

        localStorage.setItem('planificador', JSON.stringify(data));
    };

    // Guardar actividad en Local Storage
    const guardarActividad = (actividad, dia, horaInicio, horaFin) => {
        const data = JSON.parse(localStorage.getItem('planificador')) || { dias: {} };

        if (!data.dias[dia]) {
            data.dias[dia] = [];
        }

        data.dias[dia].push({ actividad, hora_inicio: horaInicio, hora_fin: horaFin });
        localStorage.setItem('planificador', JSON.stringify(data));
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const actividad = document.getElementById('actividad').value;
        const dia = document.getElementById('dia').value.toLowerCase();
        const horaInicio = document.getElementById('hora_inicio').value;
        const horaFin = document.getElementById('hora_fin').value;

        const diaDiv = document.querySelector(`.day[data-dia="${dia}"]`);
        const actividadDiv = document.createElement('div');
        actividadDiv.classList.add('activity');
        actividadDiv.textContent = `${horaInicio} - ${horaFin}: ${actividad}`;
        actividadDiv.setAttribute('data-actividad', JSON.stringify({ actividad, hora_inicio: horaInicio, hora_fin: horaFin }));
        diaDiv.appendChild(actividadDiv);

        agregarEventosDeEliminacion(actividadDiv);
        guardarActividad(actividad, dia, horaInicio, horaFin);

        form.reset();
    });

    clearButton.addEventListener('click', () => {
        localStorage.removeItem('planificador');
        const allActivities = document.querySelectorAll('.activity');
        allActivities.forEach(activity => activity.remove());
    });

    // Cargar actividades desde el archivo JSON
    const cargarActividadesDesdeJSON = async () => {
        try {
            const response = await fetch('atcitis.json'); // Asegúrate de que la ruta sea correcta
            if (!response.ok) {
                throw new Error('Error al cargar el archivo JSON');
            }
            const data = await response.json();

            const actividadesParaGuardar = data.planificador.dias; // Cambié 'semana' a 'planificador'
            Object.keys(actividadesParaGuardar).forEach(dia => {
                actividadesParaGuardar[dia].forEach(actividad => {
                    // Guardar en Local Storage
                    guardarActividad(actividad.actividad, dia.toLowerCase(), actividad.hora_inicio, actividad.hora_fin); // Asegúrate de usar 'hora_inicio' y 'hora_fin'
                });
            });

            // Renderizar actividades después de guardar
            cargarActividades();
        } catch (error) {
            console.error(error);
        }
    };

    // Cargar actividades desde el archivo JSON al inicializar
    cargarActividadesDesdeJSON();
});
