document.addEventListener("DOMContentLoaded", () => {
    // IP PÚBLICA de tu servidor AWS
    const API_URL = 'http://67.202.26.61:5000'; 
    const socket = io(API_URL);

    const allButtons = document.querySelectorAll(".control-button");
    const lastCommandDisplay = document.getElementById("last-command-display");
    const displayedCommand = document.getElementById("displayed-command");
    const obstacleWarning = document.getElementById("obstacle-warning");

    if (!allButtons || allButtons.length === 0) {
        console.log("script.js: No se encontraron botones.");
        return; 
    }

    socket.on('connect', () => {
        console.log('Conectado al servidor Socket.IO');
        // Unirse a la sala de "clientes web"
        socket.emit('join_room', { room: 'web_room' });
    });

    socket.on('disconnect', () => {
        console.log('Desconectado del servidor Socket.IO');
    });

    /**
     * Maneja el envío de un comando usando WebSockets.
     */
    async function handleCommand(command) {
        // Feedback visual inmediato
        allButtons.forEach(button => {
            button.classList.toggle("active", button.dataset.command === command);
        });
        if (displayedCommand) displayedCommand.textContent = command;
        if (lastCommandDisplay) lastCommandDisplay.classList.remove("hidden");

        console.log(`[Rover Control] Emitiendo comando: ${command}`);
        
        // Emitir el comando a la API
        socket.emit('comando_manual', { command: command });

        // Quitar feedback visual
        setTimeout(() => {
            allButtons.forEach(button => button.classList.remove("active"));
            if (lastCommandDisplay) lastCommandDisplay.classList.add("hidden");
        }, 300);
    }

    allButtons.forEach(button => {
        button.addEventListener("click", () => {
            const command = button.dataset.command;
            handleCommand(command);
        });
    });

    /**
     * Escucha las actualizaciones del historial EN TIEMPO REAL.
     */
    socket.on('actualizacion_historial', (historial) => {
        if (!historial || historial.length === 0 || !obstacleWarning) return;
        
        const latestCommand = historial[0].comando;
        console.log("Nuevo log recibido:", latestCommand);
        
        // Mostrar advertencia si el último log es un obstáculo
        if (latestCommand.includes("OBSTÁCULO") || latestCommand.includes("(BLOQUEADO)")) {
            obstacleWarning.classList.remove("hidden");
        } else {
            // Ocultar la advertencia con cualquier otro comando
            obstacleWarning.classList.add("hidden");
        }
    });
});