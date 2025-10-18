// Global Level State
// Arquivo separado para evitar dependências circulares

export let levelState = {
    currentLevel: null,
    levelData: null,
    physicsEnabled: false,
    objectiveReached: false,
    movableObjects: [],
    startElements: [],
    targetElement: null,
    attemptCount: 0
};

export function updateLevelState(updates) {
    Object.assign(levelState, updates);
}
