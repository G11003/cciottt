document.addEventListener("DOMContentLoaded", () => {
    // IP PÚBLICA de tu servidor AWS
    const API_URL = 'http://67.202.26.61:5000';
    const socket = io(API_URL);

    // --- Elementos de la UI ---
    const roverCurrentCommand = document.getElementById("rover-current-command");
    const commandHistoryList = document.getElementById("command-history");
    const btnModoManual = document.getElementById("btn-modo-manual");
    const btnModoAuto = document.getElementById("btn-modo-auto");
    const modoDisplay = document.getElementById("current-mode-display");
    
    if (!roverCurrentCommand || !commandHistoryList) {
        console.log("monitor.js: No se encontraron elementos.");
        return; 
    }

    // --- Conexión al Socket ---
    socket.on('connect', () => {
        console.log('Monitor conectado al Socket.IO');
        // Unirse a la sala web
        socket.emit('join_room', { room: 'web_room' });
        // Pedir el historial y estado actual una vez
        socket.emit('solicitar_historial');
    });

    /**
     * (¡NUEVO!) Esta función se activa CADA VEZ que la API
     * envía una actualización. Reemplaza a 'fetch' y 'setInterval'.
     */
    socket.on('actualizacion_historial', (historial) => {
        console.log("Monitor recibió actualización de historial.");
        
        // 1. Actualizar el "Estado Actual"
        if (historial.length > 0) {
            roverCurrentCommand.textContent = historial[0].comando; 
        } else {
            roverCurrentCommand.textContent = "N/A - Sin comandos";
        }

        // 2. Actualizar el historial de comandos
        commandHistoryList.innerHTML = ''; // Limpiar la lista
        
        if (historial.length === 0) {
            const li = document.createElement('li');
            li.textContent = "No hay comandos en el historial.";
            commandHistoryList.appendChild(li);
        } else {
            historial.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.timestamp}: ${item.comando}`;
                commandHistoryList.appendChild(li);
            });
        }
    });

    /**
     * (¡NUEVO!) Escucha las actualizaciones de estado (MODO).
     */
    socket.on('actualizacion_estado', (estado) => {
        if (modoDisplay && estado) {
            console.log("Monitor recibió actualización de estado:", estado.modo);
            modoDisplay.textContent = estado.modo;
        }
    });


    // --- LÓGICA DE CAMBIO DE MODO (Ahora usa 'emit') ---
    if (btnModoManual) {
        btnModoManual.addEventListener('click', () => {
            console.log("Emitiendo cambio a MODO MANUAL");
            socket.emit('cambiar_modo', { modo: 'MANUAL' });
        });
    }
    if (btnModoAuto) {
        btnModoAuto.addEventListener('click', () => {
            console.log("Emitiendo cambio a MODO AUTO");
            socket.emit('cambiar_modo', { modo: 'AUTO' });
        });
    }
});