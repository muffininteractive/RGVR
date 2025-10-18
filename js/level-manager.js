// Import physics configuration
import { PhysicsConfig, applyPhysicsMaterial } from './physics-config.js';
import { ElementFactory } from './components/element-factory.js';
import { levelState } from './level-state.js'; // Import global level state
import './components/vr-ui-components.js'; // Componentes VR UI
import './components/level-ui-components.js'; // Componentes UI do level
import './components/object-components.js'; // Componentes especializados de objetos
import './components/movement-components.js'; // Componentes de movimentação (mouse/touch e VR)

// Main level management component
AFRAME.registerComponent('level-manager', {
    schema: {
        levelId: { type: 'number', default: 1 }
    },

    init: function () {
        this.levelId = this.data.levelId;
        this.loadLevelData();

        // Aplica as configurações globais de mundo do PhysicsConfig na cena
        // this.applyWorldPhysicsConfig();

        // Event listeners
        document.addEventListener('level-play', this.startPhysics.bind(this));
        document.addEventListener('level-restart', this.restartLevel.bind(this));
        document.addEventListener('level-objective-reached', this.onObjectiveReached.bind(this));

    },


    loadLevelData: async function () {
        try {
            const response = await fetch('../data/levels-data.json');
            const data = await response.json();

            levelState.levelData = data.levels.find(level => level.id === this.levelId);

            if (levelState.levelData) {
                levelState.currentLevel = this.levelId;
                console.log(`✅ Level ${this.levelId} loaded:`, levelState.levelData.name);

                // Create level elements
                this.createLevelElements();

                // Update UI with objective
                this.updateObjectiveUI();
            } else {
                console.error(`❌ Level ${this.levelId} not found`);
            }
        } catch (error) {
            console.error('❌ Error loading level data:', error);
        }
    },

    createLevelElements: function () {
        const scene = this.el.sceneEl;
        const elements = levelState.levelData.elements;

        elements.forEach((elementData) => {
            const element = ElementFactory.createElement(elementData);
            if (element) {
                scene.appendChild(element);

                // Register special elements
                if (elementData.movable) {
                    levelState.movableObjects.push(element);
                }
                if (elementData.isStart) {
                    levelState.startElements.push(element);
                }
                if (elementData.isTarget) {
                    levelState.targetElement = element;
                    element.setAttribute('target-detector', '');
                }
            }
        });

        console.log(`✅ ${elements.length} elements created for the level`);
    },

    updateObjectiveUI: function () {
        const objectiveText = document.querySelector('#objective-text');
        if (objectiveText && levelState.levelData) {
            objectiveText.setAttribute('value', `${levelState.levelData.objective}`);
        }
    },

    startPhysics: function () {
        console.log('▶️ Iniciando física do nível...');
        const scene = this.el.sceneEl;
        levelState.physicsEnabled = true;
        levelState.attemptCount++;

        // Aplicar configuração de física para cada elemento do nível
        if (levelState.levelData && levelState.levelData.elements) {
            levelState.levelData.elements.forEach(data => {
                const element = document.querySelector(`#${data.id}`);
                ElementFactory.applyPhysicsToElement(element, data, applyPhysicsMaterial);
            });
        }

        // Remove possibilidade de mover objetos
        levelState.movableObjects.forEach(obj => {
            obj.removeAttribute('movable-element');
            obj.classList.remove('interactive');
            obj.classList.remove('grab');

        });

        // Desabilita botão Play
        const playBtn = document.querySelector('#btn-play');
        if (playBtn) {
            playBtn.setAttribute('vr-button', 'disabled: true');
        }

        // Habilita botão Restart
        const restartBtn = document.querySelector('#btn-restart');
        if (restartBtn) {
            restartBtn.setAttribute('vr-button', 'disabled: false');
            restartBtn.setAttribute('visible', true);
        }

        console.log('✅ Física ativada!');
    },

    restartLevel: function () {
        console.log('🔄 Reiniciando nível...');

        // Recarrega a página para resetar completamente
        location.reload();
    },

    onObjectiveReached: function (evt) {
        if (levelState.objectiveReached) return; // Evita múltiplas detecções

        levelState.objectiveReached = true;
        console.log('🎉 OBJETIVO ATINGIDO!');

        // Emite evento de vitória
        this.el.sceneEl.emit('level-complete', {
            levelId: this.levelId,
            attempts: levelState.attemptCount
        });

        // Mostra UI de vitória
        this.showVictoryUI();

        // Salva progresso
        this.saveProgress();
    },

    showVictoryUI: function () {
        const victoryPanel = document.querySelector('#victory-panel');
        if (victoryPanel) {
            victoryPanel.setAttribute('visible', true);
            victoryPanel.setAttribute('animation', {
                property: 'scale',
                from: '0 0 0',
                to: '1 1 1',
                dur: 500,
                easing: 'easeOutElastic'
            });
        }

        // Update stats
        const statsText = document.querySelector('#victory-stats');
        if (statsText) {
            statsText.setAttribute('value', `Attempts: ${levelState.attemptCount}`);
        }
    },

    saveProgress: function () {
        try {
            const completedLevels = JSON.parse(localStorage.getItem('rgvr-completed-levels') || '[]');

            if (!completedLevels.includes(this.levelId)) {
                completedLevels.push(this.levelId);
                localStorage.setItem('rgvr-completed-levels', JSON.stringify(completedLevels));
                console.log('💾 Progress saved');
            }
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    }
});

// Objective detector component
AFRAME.registerComponent('target-detector', {
    init: function () {
        this.collisionCount = 0;

        // Detect collisions
        this.el.addEventListener('collide', this.onCollision.bind(this));
    },

    onCollision: function (evt) {
        if (!levelState.physicsEnabled || levelState.objectiveReached) return;

        const collidedWith = evt.detail.body.el;

        // Check if collided with start element or other relevant elements
        if (collidedWith && (
            collidedWith.classList.contains('start-element') ||
            collidedWith.hasAttribute('dynamic-body')
        )) {
            this.collisionCount++;
            console.log(`🎯 Collision detected on target! (${this.collisionCount}x)`);

            // Wait a bit to ensure it's a valid collision
            setTimeout(() => {
                if (this.collisionCount > 0) {
                    document.dispatchEvent(new CustomEvent('level-objective-reached'));
                }
            }, 500);
        }
    }
});

// ============================================================
// INITIALIZATION
// ============================================================

// Executa após o módulo estar carregado e pronto
document.addEventListener('DOMContentLoaded', async () => {
    // Get the level ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const levelId = parseInt(urlParams.get('id') || '1');

    console.log(`🎮 Loading level ${levelId}...`);

    try {
        // Load level data
        const response = await fetch('../data/levels-data.json');
        const data = await response.json();
        const levelData = data.levels.find(l => l.id === levelId);

        if (!levelData) {
            console.error(`❌ Level ${levelId} not found!`);
            alert(`Level ${levelId} does not exist!`);
            window.location.href = 'level-select.html';
            return;
        }

        // Update page title
        document.title = `${levelData.name} - Wacky Works VR`;

        // Update objective panel
        const objectivePanel = document.querySelector('#objective-panel');
        if (objectivePanel) {
            objectivePanel.setAttribute('objective-panel', {
                name: 'Level ' + levelData.id + ' - ' + levelData.name || 'Goal',
                objective: levelData.objective,
                description: levelData.description || '',
            });
        }

        // Environment settings for each level
        const levelEnvironments = {
            1: { preset: 'forest', groundColor: '#2a4a2a', dressingColor: '#4a8a4a', dressingAmount: 30 },
            2: { preset: 'egypt', groundColor: '#d4a574', dressingColor: '#aa7744', dressingAmount: 20 },
            3: { preset: 'checkerboard', groundColor: '#333366', gridColor: '#6666aa', dressingAmount: 50 },
            4: { preset: 'japan', groundColor: '#4a2a2a', dressingColor: '#ff6b9d', dressingAmount: 40 },
            5: { preset: 'dream', groundColor: '#6a4a8a', dressingColor: '#aa66ff', dressingAmount: 35 },
            6: { preset: 'volcano', groundColor: '#4a2a1a', dressingColor: '#ff4400', dressingAmount: 22 },
            7: { preset: 'arches', groundColor: '#8a6a4a', dressingColor: '#cc9966', dressingAmount: 15 },
            8: { preset: 'threetowers', groundColor: '#2a2a4a', dressingColor: '#4466aa', dressingAmount: 20 },
            9: { preset: 'poison', groundColor: '#2a4a2a', dressingColor: '#66ff33', dressingAmount: 45 },
            10: { preset: 'tron', groundColor: '#0a0a1a', dressingColor: '#00ffff', dressingAmount: 30 },
            11: { preset: 'starry', groundColor: '#1a1a2a', dressingColor: '#ffffff', dressingAmount: 60 },
            12: { preset: 'osiris', groundColor: '#3a3a5a', dressingColor: '#ffaa00', dressingAmount: 25 },
            13: { preset: 'arches', groundColor: '#8a6a4a', dressingColor: '#cc9966', dressingAmount: 5 },
        };

        // Set specific environment for the level
        const envConfig = levelEnvironments[levelId] || levelEnvironments[1];
        const envEl = document.querySelector('#environment');
        if (envEl) {
            const envSettings = `preset: ${envConfig.preset}; groundColor: ${envConfig.groundColor}; ${envConfig.gridColor ? 'gridColor: ' + envConfig.gridColor + ';' : ''} dressingAmount: ${envConfig.dressingAmount}; dressingColor: ${envConfig.dressingColor};shadow:true;shadowSize:10;`;
            envEl.setAttribute('environment', envSettings);
        }

        // Add level-manager with levelId
        const scene = document.querySelector('a-scene');
        scene.setAttribute('level-manager', `levelId: ${levelId}`);

        console.log(`✅ Level ${levelId} successfully configured!`);
    } catch (error) {
        console.error('❌ Error loading level data:', error);
        alert('Error loading level!');
        window.location.href = 'level-select.html';
    }

    // Listener for back button
    const btnBack = document.querySelector('#btn-back');
    if (btnBack) {
        btnBack.addEventListener('vr-button-clicked', evt => {
            if (evt.detail.action === 'back') {
                window.location.href = 'level-select.html';
            }
        });
    }
});

export { levelState };