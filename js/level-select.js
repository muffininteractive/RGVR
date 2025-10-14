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
        levelId: { type: 'number', default: 1 },
        difficulty: { type: 'string', default: 'easy' }
    },

    init: function () {
        this.levelId = this.data.levelId;
        this.difficulty = this.data.difficulty;
        this.crystal = this.el.querySelector('a-octahedron');
        this.isSelected = false;
        this.isHovered = false;

        this.originalScale = this.crystal.getAttribute('scale') || { x: 1, y: 1, z: 1 };
        this.originalColor = this.crystal.getAttribute('color');

        // Marca como completado se já foi feito
        this.checkCompletion();

        // Event listeners
        this.el.addEventListener('mouseenter', this.onHover.bind(this));
        this.el.addEventListener('mouseleave', this.onUnhover.bind(this));
        this.el.addEventListener('click', this.onSelect.bind(this));

        // Para controles VR
        this.crystal.addEventListener('click', this.onSelect.bind(this));
    },

    checkCompletion: function () {
        try {
            const completedLevels = JSON.parse(localStorage.getItem('rgvr-completed-levels') || '[]');
            if (completedLevels.includes(this.levelId)) {
                // Adiciona indicador visual de completado
                const checkmark = document.createElement('a-text');
                checkmark.setAttribute('value', '✓');
                checkmark.setAttribute('position', '0 1.5 0');
                checkmark.setAttribute('align', 'center');
                checkmark.setAttribute('color', '#00ff00');
                checkmark.setAttribute('width', 3);
                this.el.appendChild(checkmark);
            }
        } catch (error) {
            console.error('Erro ao verificar níveis completados:', error);
        }
    },

    onHover: function () {
        if (this.isSelected) return;

        this.isHovered = true;
        levelSelectState.hoveredLevel = this.levelId;

        // Efeito visual de hover
        this.crystal.setAttribute('animation__hover', {
            property: 'scale',
            to: '1.3 1.3 1.3',
            dur: 300
        });

        this.crystal.setAttribute('animation__glow', {
            property: 'material.emissiveIntensity',
            to: 0.5,
            dur: 300
        });

        // Atualiza interface VR
        LevelSelectManager.updateLevelInfoVR(this.levelId);

        console.log(`Hovering over level: ${this.levelId}`);
    },

    onUnhover: function () {
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
            LevelSelectManager.clearLevelInfoVR();
        }
    },

    onSelect: function () {
        console.log(`Selected level: ${this.levelId}`);

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
        levelSelectState.selectedLevel = this.levelId;
        LevelSelectManager.onLevelSelected(this.levelId);
    },

    select: function () {
        this.isSelected = true;

        // Efeito visual de seleção
        this.crystal.setAttribute('animation__select', {
            property: 'scale',
            to: '1.4 1.4 1.4',
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

    deselect: function () {
        this.isSelected = false;

        // Remove animações
        this.crystal.removeAttribute('animation__select');
        this.crystal.removeAttribute('animation__pulse');
        this.crystal.setAttribute('scale', this.originalScale);
        this.crystal.setAttribute('material.emissiveIntensity', 0);

        // Remove anel de seleção
        this.removeSelectionRing();
    },

    addSelectionRing: function () {
        if (this.selectionRing) return;

        this.selectionRing = document.createElement('a-torus');
        this.selectionRing.setAttribute('position', '0 0 0');
        this.selectionRing.setAttribute('radius', 1.2);
        this.selectionRing.setAttribute('radius-tubular', 0.08);
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

    removeSelectionRing: function () {
        if (this.selectionRing) {
            this.el.removeChild(this.selectionRing);
            this.selectionRing = null;
        }
    }
});

// Componente para interação com controles VR
AFRAME.registerComponent('level-interaction', {
    init: function () {
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
    },

    onTriggerDown: function () {
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

        await this.loadLevelData();
        this.setupEventListeners();

        console.log('Level Select initialized');
    }

    static async loadLevelData() {
        try {
            const response = await fetch('../data/levels-data.json');
            const data = await response.json();

            // Converte array de níveis em objeto indexado por ID
            levelSelectState.levelData = {};
            data.levels.forEach(level => {
                levelSelectState.levelData[level.id] = level;
            });

            console.log('✅ Dados de 12 níveis carregados:', levelSelectState.levelData);
        } catch (error) {
            console.error('❌ Erro ao carregar dados dos níveis:', error);
            // Dados de fallback básicos
            levelSelectState.levelData = {};
            for (let i = 1; i <= 12; i++) {
                levelSelectState.levelData[i] = {
                    id: i,
                    name: `Nível ${i}`,
                    difficulty: i <= 3 ? 'easy' : i <= 6 ? 'medium' : i <= 9 ? 'hard' : 'expert',
                    objective: 'Complete o desafio',
                    description: 'Descrição do nível'
                };
            }
        }
    }

    static setupEventListeners() {
        // Botão Voltar
        const btnBack = document.getElementById('btn-back');
        btnBack?.addEventListener('vr-button-clicked', () => {
            console.log('Back button clicked');
            window.location.href = '../index.html';
        });

        // Botão Select
        const btnSelect = document.getElementById('btn-select');
        btnSelect?.addEventListener('vr-button-clicked', () => {
            if (levelSelectState.selectedLevel) {
                this.startLevel(levelSelectState.selectedLevel);
            }
        });
    }

    static updateLevelInfoVR(levelId) {
        const levelInfoPanel = document.getElementById('level-info-panel');
        const levelTitle = document.getElementById('level-title');
        const levelDesc = document.getElementById('level-desc');
        const levelStats = document.getElementById('level-stats');

        if (!levelSelectState.levelData) return;

        const level = levelSelectState.levelData[levelId];
        if (level && levelInfoPanel) {
            levelInfoPanel.setAttribute('visible', true);

            if (levelTitle) {
                levelTitle.setAttribute('value', `NÍVEL ${levelId}: ${level.name.toUpperCase()}`);
            }
            if (levelDesc) {
                levelDesc.setAttribute('value', level.objective);
            }
            if (levelStats) {
                const difficultyLabel = {
                    'easy': 'Fácil',
                    'medium': 'Médio',
                    'hard': 'Difícil',
                    'expert': 'Expert'
                }[level.difficulty] || level.difficulty;

                levelStats.setAttribute('value', `Dificuldade: ${difficultyLabel}`);
            }
        }
    }

    static clearLevelInfoVR() {
        const levelInfoPanel = document.getElementById('level-info-panel');
        if (levelInfoPanel) {
            levelInfoPanel.setAttribute('visible', false);
        }
    }

    static onLevelSelected(levelId) {
        console.log(`Level selected: ${levelId}`);

        // Habilita botão de select
        const btnSelect = document.getElementById('btn-select');
        if (btnSelect) {
            btnSelect.setAttribute('vr-button', 'disabled', false);
        }

        // Efeito sonoro (se disponível)
        const selectSound = document.getElementById('selectSound');
        if (selectSound) {
            selectSound.play().catch(e => console.log('Audio não disponível'));
        }

        // Atualiza info do nível
        this.updateLevelInfoVR(levelId);
    }

    static startLevel(levelId) {
        console.log(`Starting level: ${levelId}`);

        // Navega para a página dinâmica do nível com query parameter
        window.location.href = `level.html?id=${levelId}`;
    }

    // Efeito de partículas para celebração
    static playSelectionEffect(position) {
        const colors = ['#00ff88', '#ffdd00', '#ff8800', '#ff0044'];

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('a-sphere');
                particle.setAttribute('radius', 0.05);
                particle.setAttribute('color', colors[Math.floor(Math.random() * colors.length)]);
                particle.setAttribute('material', 'transparent: true');
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

    // Obtém progresso do jogador
    static getCompletedLevels() {
        try {
            return JSON.parse(localStorage.getItem('rgvr-completed-levels') || '[]');
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
            return [];
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
