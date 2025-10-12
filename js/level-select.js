// Level Select System - RGVR
import { SceneManager } from '../utils/scene-manager.js';

// Estado da seleção de nível
let levelSelectState = {
    selectedLevel: null,
    hoveredLevel: null,
    levelData: null
};

// Componente para seleção de nível
AFRAME.registerComponent('level-selector', {
    schema: {
        difficulty: { type: 'string', default: 'easy' }
    },

    init: function() {
        this.difficulty = this.data.difficulty;
        this.crystal = this.el.querySelector('a-octahedron');
        this.isSelected = false;
        this.isHovered = false;
        
        this.originalScale = this.crystal.getAttribute('scale') || { x: 1, y: 1, z: 1 };
        this.originalColor = this.crystal.getAttribute('color');
        
        // Event listeners
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));
        this.el.addEventListener('click', this.onSelect.bind(this));
    },

    onHover: function() {
        if (this.isSelected) return;
        
        this.isHovered = true;
        levelSelectState.hoveredLevel = this.difficulty;
        
        // Efeito visual de hover
        this.crystal.setAttribute('animation__hover', {
            property: 'scale',
            to: '1.2 1.2 1.2',
            dur: 300
        });
        
        this.crystal.setAttribute('animation__glow', {
            property: 'material.emissiveIntensity',
            to: 0.5,
            dur: 300
        });
        
        // Atualiza interface
        LevelSelectManager.updateLevelInfo(this.difficulty);
        LevelSelectManager.updateFeedback(`Nível: ${this.difficulty.toUpperCase()}`);
        
        console.log(`Hovering over level: ${this.difficulty}`);
    },

    onUnhover: function() {
        if (this.isSelected) return;
        
        this.isHovered = false;
        levelSelectState.hoveredLevel = null;
        
        // Remove efeito visual
        this.crystal.removeAttribute('animation__hover');
        this.crystal.removeAttribute('animation__glow');
        this.crystal.setAttribute('scale', this.originalScale);
        this.crystal.setAttribute('material.emissiveIntensity', 0);
        
        // Limpa interface se não há nível selecionado
        if (!levelSelectState.selectedLevel) {
            LevelSelectManager.clearLevelInfo();
            LevelSelectManager.updateFeedback('');
        }
    },

    onSelect: function() {
        console.log(`Selected level: ${this.difficulty}`);
        
        // Deseleciona outros níveis
        document.querySelectorAll('[level-selector]').forEach(el => {
            const component = el.components['level-selector'];
            if (component && component !== this) {
                component.deselect();
            }
        });
        
        // Seleciona este nível
        this.select();
        
        // Atualiza estado global
        levelSelectState.selectedLevel = this.difficulty;
        LevelSelectManager.onLevelSelected(this.difficulty);
    },

    select: function() {
        this.isSelected = true;
        
        // Efeito visual de seleção
        this.crystal.setAttribute('animation__select', {
            property: 'scale',
            to: '1.3 1.3 1.3',
            dur: 500
        });
        
        this.crystal.setAttribute('animation__pulse', {
            property: 'material.emissiveIntensity',
            to: 0.8,
            dur: 1000,
            dir: 'alternate',
            loop: true
        });
        
        // Adiciona anel de seleção
        this.addSelectionRing();
    },

    deselect: function() {
        this.isSelected = false;
        
        // Remove animações
        this.crystal.removeAttribute('animation__select');
        this.crystal.removeAttribute('animation__pulse');
        this.crystal.setAttribute('scale', this.originalScale);
        this.crystal.setAttribute('material.emissiveIntensity', 0);
        
        // Remove anel de seleção
        this.removeSelectionRing();
    },

    addSelectionRing: function() {
        if (this.selectionRing) return;
        
        this.selectionRing = document.createElement('a-torus');
        this.selectionRing.setAttribute('position', '0 1 0');
        this.selectionRing.setAttribute('radius', 2);
        this.selectionRing.setAttribute('radius-tubular', 0.1);
        this.selectionRing.setAttribute('color', '#ffffff');
        this.selectionRing.setAttribute('material', 'emissive: #ffffff; emissiveIntensity: 0.5');
        this.selectionRing.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            dur: 3000,
            loop: true
        });
        
        this.el.appendChild(this.selectionRing);
    },

    removeSelectionRing: function() {
        if (this.selectionRing) {
            this.el.removeChild(this.selectionRing);
            this.selectionRing = null;
        }
    }
});

// Componente para interação com controles VR
AFRAME.registerComponent('level-interaction', {
    init: function() {
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
    },

    onTriggerDown: function() {
        const raycasterComponent = this.el.components.raycaster;
        if (!raycasterComponent) return;

        const intersections = raycasterComponent.intersections;
        if (intersections && intersections.length > 0) {
            const intersection = intersections[0];
            const levelEntity = intersection.object.el.closest('[level-selector]');
            
            if (levelEntity) {
                // Simula click
                levelEntity.emit('click');
            }
        }
    }
});

// Gerenciador principal da seleção de nível
class LevelSelectManager {
    static async init() {
        console.log('Inicializando Level Select...');
        
        try {
            // Carrega dados dos níveis
            const response = await fetch('../data/objects.json');
            const data = await response.json();
            levelSelectState.levelData = data.levels;
            
            console.log('Level data loaded:', levelSelectState.levelData);
        } catch (error) {
            console.error('Erro ao carregar dados dos níveis:', error);
        }

        // Event listeners para botões
        document.getElementById('backToTutorial')?.addEventListener('click', () => {
            SceneManager.loadScene('tutorial');
        });

        document.getElementById('startSelectedLevel')?.addEventListener('click', () => {
            if (levelSelectState.selectedLevel) {
                this.startGame(levelSelectState.selectedLevel);
            }
        });
        
        // Inicializa interface
        this.clearLevelInfo();
        this.updateFeedback('Escolha um nível de dificuldade');
    }

    static updateLevelInfo(difficulty) {
        const levelInfo = document.getElementById('level-description');
        if (!levelInfo || !levelSelectState.levelData) return;

        const level = levelSelectState.levelData[difficulty];
        if (level) {
            levelInfo.innerHTML = `
                <h3>${level.name}</h3>
                <p>${level.description}</p>
                <div class="level-stats">
                    <span class="stat">Objetos: ${level.objectCount}</span>
                    <span class="stat">Dificuldade: ${difficulty.toUpperCase()}</span>
                </div>
            `;
        }
    }

    static clearLevelInfo() {
        const levelInfo = document.getElementById('level-description');
        if (levelInfo) {
            levelInfo.innerHTML = `
                <h3>Selecione um nível</h3>
                <p>Aponte para um dos cristais para ver detalhes</p>
            `;
        }
    }

    static onLevelSelected(difficulty) {
        console.log(`Level selected: ${difficulty}`);
        
        // Habilita botão de iniciar
        const startButton = document.getElementById('startSelectedLevel');
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = `Iniciar Nível ${difficulty.toUpperCase()}`;
        }
        
        // Atualiza feedback
        this.updateFeedback(`Nível ${difficulty.toUpperCase()} selecionado!`);
        
        // Efeito sonoro (se disponível)
        const selectSound = document.getElementById('selectSound');
        if (selectSound) {
            selectSound.play().catch(e => console.log('Audio não disponível'));
        }

        // Auto-start após delay (opcional)
        setTimeout(() => {
            this.startGame(difficulty);
        }, 2000);
    }

    static startGame(difficulty) {
        console.log(`Starting game with difficulty: ${difficulty}`);
        
        // Salva dificuldade selecionada para a próxima cena
        SceneManager.setGameData({
            difficulty: difficulty,
            levelData: levelSelectState.levelData[difficulty]
        });
        
        this.updateFeedback('Carregando jogo...');
        
        // Transição para o jogo
        setTimeout(() => {
            SceneManager.loadScene('game');
        }, 1500);
    }

    static updateFeedback(message) {
        const feedback = document.querySelector('#level-feedback');
        if (feedback) {
            feedback.setAttribute('value', message);
        }
    }

    // Efeito de partículas para celebração
    static playSelectionEffect(position) {
        const colors = ['#00ff88', '#ffdd00', '#ff8800', '#ff0044'];
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('a-sphere');
                particle.setAttribute('radius', 0.05);
                particle.setAttribute('color', colors[Math.floor(Math.random() * colors.length)]);
                particle.setAttribute('position', position);
                particle.setAttribute('animation', {
                    property: 'position',
                    to: `${position.x + (Math.random() - 0.5) * 4} ${position.y + Math.random() * 3} ${position.z + (Math.random() - 0.5) * 4}`,
                    dur: 1500
                });
                particle.setAttribute('animation__opacity', {
                    property: 'material.opacity',
                    to: 0,
                    dur: 1500
                });
                
                document.querySelector('a-scene').appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 2000);
            }, i * 100);
        }
    }
}

// Inicialização quando a cena carregar
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        LevelSelectManager.init();
    } else {
        scene.addEventListener('loaded', () => {
            LevelSelectManager.init();
        });
    }
});

// Exporta para debug
window.LevelSelectManager = LevelSelectManager;
window.levelSelectState = levelSelectState;