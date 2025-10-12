// Game Logic - RGVR
import { SceneManager } from '../utils/scene-manager.js';
import { LevelGenerator } from '../utils/level-generator.js';

// Estado do jogo
let gameState = {
    difficulty: 'easy',
    currentLevel: null,
    objectsInScene: [],
    connections: [],
    startTime: null,
    gameTimer: null,
    isComplete: false,
    hintsUsed: 0
};

// Componente principal do gerenciador de jogo
AFRAME.registerComponent('game-manager', {
    init: function() {
        console.log('Game Manager initialized');
        this.setupGame();
    },

    async setupGame() {
        // Obtém dados da cena anterior
        const gameData = SceneManager.getGameData();
        gameState.difficulty = gameData.difficulty || 'easy';
        
        console.log('Starting game with difficulty:', gameState.difficulty);
        
        // Gera o nível
        gameState.currentLevel = await LevelGenerator.generateLevel(gameState.difficulty);
        
        if (!gameState.currentLevel) {
            console.error('Failed to generate level');
            return;
        }
        
        // Configura interface
        this.updateUI();
        
        // Cria objetos na cena
        this.createLevelObjects();
        
        // Configura listeners de eventos
        this.setupEventListeners();
        
        // Inicia timer
        this.startTimer();
        
        // Configura animações globais
        this.setupGlobalAnimations();
        
        console.log('Game setup complete', gameState);
    },

    updateUI() {
        const level = gameState.currentLevel;
        
        // Atualiza título
        const title = document.getElementById('level-title');
        if (title) {
            title.textContent = `Nível ${level.difficulty.charAt(0).toUpperCase() + level.difficulty.slice(1)}`;
        }
        
        // Atualiza objetivo
        const objective = document.getElementById('objective');
        if (objective) {
            objective.textContent = `Conecte ${level.startObject.name} até ${level.endObject.name}`;
        }
        
        // Atualiza dicas
        this.updateHints();
        
        // Atualiza progresso
        this.updateProgress();
    },

    updateHints() {
        const hintsList = document.getElementById('hints-list');
        if (!hintsList) return;
        
        const hints = LevelGenerator.getHints();
        hintsList.innerHTML = '';
        
        hints.forEach(hint => {
            const li = document.createElement('li');
            li.textContent = hint;
            hintsList.appendChild(li);
        });
    },

    updateProgress() {
        const progress = document.getElementById('progress');
        if (!progress) return;
        
        const total = gameState.currentLevel.objects.length - 1; // Conexões necessárias
        const current = gameState.connections.length;
        
        progress.textContent = `${current} / ${total} conexões`;
    },

    createLevelObjects() {
        const objectsContainer = document.getElementById('game-objects');
        const level = gameState.currentLevel;
        
        // Remove objetos anteriores
        while (objectsContainer.firstChild) {
            objectsContainer.removeChild(objectsContainer.firstChild);
        }
        
        gameState.objectsInScene = [];
        
        // Cria cada objeto do nível
        level.objects.forEach((objData, index) => {
            const position = level.placements[objData.id];
            const element = this.createGameObject(objData, position, index);
            
            objectsContainer.appendChild(element);
            gameState.objectsInScene.push(element);
        });
        
        // Destaca objetos start e end
        this.highlightStartAndEndObjects();
    },

    createGameObject(objData, position, index) {
        // Cria elemento baseado no arquivo do componente
        const element = document.createElement('a-entity');
        element.id = `game-object-${index}`;
        
        // Configura componente base
        element.setAttribute('game-object', {
            objectId: objData.id,
            objectData: JSON.stringify(objData),
            isStart: objData.id === gameState.currentLevel.startObject.id,
            isEnd: objData.id === gameState.currentLevel.endObject.id,
            canGrab: true
        });
        
        // Adiciona componente específico
        element.setAttribute(objData.file, '');
        
        // Configura posição
        element.setAttribute('position', position);
        
        // Adiciona mixin
        element.setAttribute('mixin', 'interactive-object');
        
        console.log(`Created object: ${objData.name} at`, position);
        
        return element;
    },

    highlightStartAndEndObjects() {
        const level = gameState.currentLevel;
        
        // Encontra elementos start e end
        const startElement = gameState.objectsInScene.find(el => 
            el.getAttribute('game-object').objectId === level.startObject.id
        );
        const endElement = gameState.objectsInScene.find(el => 
            el.getAttribute('game-object').objectId === level.endObject.id
        );
        
        if (startElement) {
            startElement.components['game-object'].highlight('start');
            this.positionIndicator('start-indicator', startElement);
            this.positionLight('start-light', startElement);
        }
        
        if (endElement) {
            endElement.components['game-object'].highlight('end');
            this.positionIndicator('end-indicator', endElement);
            this.positionLight('end-light', endElement);
        }
    },

    positionIndicator(indicatorId, targetElement) {
        const indicator = document.getElementById(indicatorId);
        const light = document.getElementById(indicatorId.replace('indicator', 'light'));
        
        if (indicator && targetElement) {
            const pos = targetElement.getAttribute('position');
            indicator.setAttribute('position', `${pos.x} ${pos.y + 3} ${pos.z}`);
            indicator.setAttribute('visible', true);
            
            if (light) {
                light.setAttribute('position', `${pos.x} ${pos.y + 2} ${pos.z}`);
                light.setAttribute('visible', true);
            }
        }
    },

    positionLight(lightId, targetElement) {
        const light = document.getElementById(lightId);
        
        if (light && targetElement) {
            const pos = targetElement.getAttribute('position');
            light.setAttribute('position', `${pos.x} ${pos.y + 2} ${pos.z}`);
            light.setAttribute('visible', true);
        }
    },

    setupEventListeners() {
        // Eventos dos objetos
        this.el.addEventListener('objects-connected', this.onObjectsConnected.bind(this));
        this.el.addEventListener('object-grabbed', this.onObjectGrabbed.bind(this));
        this.el.addEventListener('object-released', this.onObjectReleased.bind(this));
        
        // Botões da interface
        document.getElementById('showHint')?.addEventListener('click', this.showHint.bind(this));
        document.getElementById('resetLevel')?.addEventListener('click', this.resetLevel.bind(this));
        document.getElementById('backToLevelSelect')?.addEventListener('click', this.backToLevelSelect.bind(this));
        
        // Overlay de vitória
        document.getElementById('nextLevel')?.addEventListener('click', this.nextLevel.bind(this));
        document.getElementById('playAgain')?.addEventListener('click', this.playAgain.bind(this));
        document.getElementById('backToMenu')?.addEventListener('click', this.backToMenu.bind(this));
    },

    onObjectsConnected(event) {
        const { from, to, connectionId } = event.detail;
        
        console.log(`Objects connected: ${from} -> ${to}`);
        
        // Adiciona à lista de conexões
        gameState.connections.push({ from, to, connectionId });
        
        // Atualiza interface
        this.updateProgress();
        this.updateGameFeedback(`Conexão criada: ${from} -> ${to}`);
        
        // Verifica se o jogo foi completado
        this.checkGameCompletion();
    },

    onObjectGrabbed(event) {
        const { objectId } = event.detail;
        console.log(`Object grabbed: ${objectId}`);
        
        // Feedback visual
        this.updateGameFeedback(`Segurando: ${objectId}`);
    },

    onObjectReleased(event) {
        const { objectId } = event.detail;
        console.log(`Object released: ${objectId}`);
        
        this.updateGameFeedback('');
    },

    checkGameCompletion() {
        // Verifica se existe um caminho válido do start ao end
        const path = LevelGenerator.findValidPath();
        
        if (path && this.isPathComplete(path)) {
            this.completeGame();
        }
    },

    isPathComplete(path) {
        // Verifica se todas as conexões do caminho existem
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            
            const connectionExists = gameState.connections.some(conn => 
                conn.from === from && conn.to === to
            );
            
            if (!connectionExists) {
                return false;
            }
        }
        
        return true;
    },

    completeGame() {
        if (gameState.isComplete) return;
        
        gameState.isComplete = true;
        this.stopTimer();
        
        console.log('Game completed!');
        
        // Efeito de vitória
        this.playVictoryEffect();
        
        // Mostra overlay de vitória
        setTimeout(() => {
            this.showVictoryScreen();
        }, 2000);
    },

    playVictoryEffect() {
        // Efeito de partículas
        this.createVictoryParticles();
        
        // Feedback sonoro (se disponível)
        this.updateGameFeedback('🎉 NÍVEL COMPLETADO! 🎉');
    },

    createVictoryParticles() {
        const colors = ['#FFD700', '#FF69B4', '#00FF7F', '#FF4500', '#DA70D6'];
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const particle = document.createElement('a-sphere');
                particle.setAttribute('radius', 0.1);
                particle.setAttribute('color', colors[Math.floor(Math.random() * colors.length)]);
                particle.setAttribute('position', `${(Math.random() - 0.5) * 10} 8 ${-6 + (Math.random() - 0.5) * 4}`);
                particle.setAttribute('animation', {
                    property: 'position',
                    to: `${(Math.random() - 0.5) * 20} 0 ${-6 + (Math.random() - 0.5) * 8}`,
                    dur: 3000
                });
                particle.setAttribute('animation__fade', {
                    property: 'material.opacity',
                    to: 0,
                    dur: 3000
                });
                
                this.el.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3500);
            }, i * 100);
        }
    },

    showVictoryScreen() {
        const overlay = document.getElementById('victory-overlay');
        const finalTime = document.getElementById('final-time');
        const finalConnections = document.getElementById('final-connections');
        
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        if (finalTime) {
            finalTime.textContent = this.formatTime(this.getElapsedTime());
        }
        
        if (finalConnections) {
            finalConnections.textContent = gameState.connections.length;
        }
    },

    startTimer() {
        gameState.startTime = Date.now();
        gameState.gameTimer = setInterval(() => {
            this.updateTimer();
        }, 1000);
    },

    stopTimer() {
        if (gameState.gameTimer) {
            clearInterval(gameState.gameTimer);
            gameState.gameTimer = null;
        }
    },

    updateTimer() {
        const timer = document.getElementById('timer');
        if (timer) {
            timer.textContent = this.formatTime(this.getElapsedTime());
        }
    },

    getElapsedTime() {
        return gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    updateGameFeedback(message) {
        const feedback = document.getElementById('game-feedback');
        if (feedback) {
            feedback.setAttribute('value', message);
        }
    },

    setupGlobalAnimations() {
        // Carrega animações do JSON para uso global
        if (gameState.currentLevel && gameState.currentLevel.animations) {
            window.gameAnimations = gameState.currentLevel.animations;
        }
    },

    // Event handlers para botões
    showHint() {
        gameState.hintsUsed++;
        
        const hints = LevelGenerator.getHints();
        if (hints.length > gameState.hintsUsed) {
            this.updateGameFeedback(`Dica: ${hints[gameState.hintsUsed - 1]}`);
        } else {
            this.updateGameFeedback('Sem mais dicas disponíveis!');
        }
        
        setTimeout(() => {
            this.updateGameFeedback('');
        }, 5000);
    },

    resetLevel() {
        // Reset do estado
        gameState.connections = [];
        gameState.isComplete = false;
        gameState.hintsUsed = 0;
        
        // Remove conexões visuais
        const connectionsContainer = document.getElementById('connections');
        while (connectionsContainer.firstChild) {
            connectionsContainer.removeChild(connectionsContainer.firstChild);
        }
        
        // Reset dos objetos
        gameState.objectsInScene.forEach(element => {
            const component = element.components['game-object'];
            if (component) {
                component.reset();
            }
        });
        
        // Reinicia timer
        this.stopTimer();
        this.startTimer();
        
        // Atualiza interface
        this.updateProgress();
        this.updateGameFeedback('Nível reiniciado!');
        
        // Esconde overlay de vitória
        const overlay = document.getElementById('victory-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    backToLevelSelect() {
        this.stopTimer();
        SceneManager.loadScene('level-select');
    },

    nextLevel() {
        // Lógica para próximo nível (se implementada)
        this.playAgain();
    },

    playAgain() {
        this.stopTimer();
        SceneManager.loadScene('game', { difficulty: gameState.difficulty });
    },

    backToMenu() {
        this.stopTimer();
        SceneManager.loadScene('level-select');
    }
});

// Componente melhorado para grab handler
AFRAME.registerComponent('game-grab-handler', {
    init: function() {
        this.grabbedObject = null;
        this.grabDistance = 2.0;
        this.minDistance = 1.0;
        this.maxDistance = 8.0;
        
        // Event listeners
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
        this.el.addEventListener('triggerup', this.onTriggerUp.bind(this));
        this.el.addEventListener('thumbstickmoved', this.onThumbstickMoved.bind(this));
    },

    onTriggerDown: function() {
        if (this.grabbedObject) return;

        const raycasterComponent = this.el.components.raycaster;
        if (!raycasterComponent) return;

        const intersections = raycasterComponent.intersections;
        if (intersections && intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object.el;

            if (object && object.classList.contains('grab')) {
                this.grabObject(object);
                
                // Emite evento customizado
                object.emit('grab-start');
            }
        }
    },

    onTriggerUp: function() {
        if (this.grabbedObject) {
            // Emite evento antes de soltar
            this.grabbedObject.emit('grab-end');
            this.releaseObject();
        }
    },

    onThumbstickMoved: function(evt) {
        if (this.grabbedObject) {
            const { y } = evt.detail;
            
            if (Math.abs(y) > 0.1) {
                this.grabDistance -= y * 0.1;
                this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));
            }
            
            evt.stopPropagation();
        }
    },

    grabObject: function(object) {
        this.grabbedObject = object;
        
        // Calcula distância inicial
        const controllerPos = new THREE.Vector3();
        const objPos = new THREE.Vector3();
        
        this.el.object3D.getWorldPosition(controllerPos);
        object.object3D.getWorldPosition(objPos);
        
        this.grabDistance = controllerPos.distanceTo(objPos);
        this.grabDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.grabDistance));
    },

    releaseObject: function() {
        this.grabbedObject = null;
    },

    tick: function() {
        if (this.grabbedObject) {
            const controllerPos = new THREE.Vector3();
            const controllerDir = new THREE.Vector3();

            this.el.object3D.getWorldPosition(controllerPos);
            this.el.object3D.getWorldDirection(controllerDir);
            
            controllerDir.negate();
            const targetPos = controllerPos.clone().add(controllerDir.multiplyScalar(this.grabDistance));
            
            // Mantém acima do chão
            if (targetPos.y < 0.5) targetPos.y = 0.5;
            
            this.grabbedObject.object3D.position.set(targetPos.x, targetPos.y, targetPos.z);
        }
    }
});

// Inicialização quando o documento carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Game page loaded');
});

// Exporta para debug
window.gameState = gameState;