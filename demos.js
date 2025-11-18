document.addEventListener("DOMContentLoaded", () => {
    // IP PÚBLICA de tu servidor AWS
    const API_URL = 'http://67.202.26.61:5000';
    const socket = io(API_URL);

    // --- Elementos de "Demos" ---
    const demoNombreInput = document.getElementById("demo-nombre-input");
    const sequenceBuilderControls = document.querySelector(".sequence-builder-controls");
    const demoSequenceList = document.getElementById("demo-sequence-list");
    const saveDemoButton = document.getElementById("save-demo-button");
    const clearDemoButton = document.getElementById("clear-demo-button");
    const demoList = document.getElementById("demo-list");

    if (!demoNombreInput || !demoList) {
        console.log("demos.js: No se encontraron elementos de demos.");
        return;
    }
    
    let currentSequence = [];

    // --- Conexión al Socket ---
    socket.on('connect', () => {
        console.log('Demos conectado al Socket.IO');
        // Unirse a la sala web
        socket.emit('join_room', { room: 'web_room' });
        // Pedir la lista de demos actual
        socket.emit('solicitar_demos');
    });

    /**
     * (¡NUEVO!) Se activa cuando la API envía la lista de demos.
     */
    socket.on('actualizacion_demos', (demos) => {
        console.log("Demos recibió actualización de la lista.");
        if (demos.length === 0) {
            demoList.innerHTML = '<li>No hay demos guardadas.</li>';
            return;
        }

        demoList.innerHTML = '';
        demos.forEach(demo => {
            const li = document.createElement('li');
            li.textContent = demo.nombre;
            
            const runButton = document.createElement('button');
            runButton.textContent = 'Ejecutar';
            runButton.className = 'demo-run-button';
            runButton.dataset.id = demo.id;
            
            runButton.addEventListener('click', (e) => {
                e.stopPropagation(); 
                runDemo(demo.id, demo.nombre);
            });
            
            li.appendChild(runButton);
            demoList.appendChild(li);
        });
    });


    // --- LÓGICA DE CREAR DEMO ---
    
    function updateSequenceList() {
        if (currentSequence.length === 0) {
            demoSequenceList.innerHTML = '<li>Añade movimientos...</li>';
            return;
        }
        demoSequenceList.innerHTML = ''; 
        currentSequence.forEach((comando, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${comando}`;
            demoSequenceList.appendChild(li);
        });
    }

    if (sequenceBuilderControls) {
        sequenceBuilderControls.addEventListener('click', (e) => {
            if (e.target.matches('.control-button-demo')) {
                const command = e.target.dataset.command;
                currentSequence.push(command);
                updateSequenceList();
            }
        });
    }

    if (clearDemoButton) {
        clearDemoButton.addEventListener('click', () => {
            currentSequence = [];
            updateSequenceList();
        });
    }

    // (¡MODIFICADO! Ahora usa 'emit')
    if (saveDemoButton) {
        saveDemoButton.addEventListener('click', () => {
            const nombre = demoNombreInput.value.trim();
            if (nombre === '') {
                alert('Por favor, ponle un nombre a la demo.');
                return;
            }
            if (currentSequence.length === 0) {
                alert('Por favor, añade al menos un movimiento.');
                return;
            }

            console.log(`Emitiendo 'guardar_demo' con nombre: ${nombre}`);
            socket.emit('guardar_demo', {
                nombre: nombre,
                movimientos: currentSequence
            });
            
            // La API nos notificará con 'actualizacion_demos'
            // lo que recargará la lista automáticamente.
            
            alert('¡Demo enviada para guardar!');
            demoNombreInput.value = '';
            currentSequence = [];
            updateSequenceList();
        });
    }

    // --- LÓGICA DE EJECUTAR DEMO (¡MUCHO MÁS SIMPLE!) ---
    
    function runDemo(id, nombre) {
        if (!confirm(`¿Estás seguro de que quieres ejecutar la demo "${nombre}"?`)) {
            return;
        }

        alert(`Iniciando demo: "${nombre}".\nEl robot comenzará a moverse.`);
        console.log(`Emitiendo 'ejecutar_demo' con ID: ${id}`);
        
        // Simplemente le decimos a la API que ejecute la demo.
        // La API obtendrá los pasos y se los enviará al robot.
        socket.emit('ejecutar_demo', { id: id });
        
        // Redirigir al monitor para ver el progreso
        setTimeout(() => {
             window.location.href = 'monitor.html';
        }, 500);
    }

    // --- INICIALIZACIÓN ---
    updateSequenceList();
});