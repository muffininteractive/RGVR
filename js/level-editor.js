let levelsData = null;
let currentLevelIndex = null;
let currentElementIndex = null;

// Carrega os dados dos níveis
async function loadLevelsData() {
    try {
        const response = await fetch('http://localhost:3001/api/levels');
        levelsData = await response.json();
        renderLevelsList();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar os dados dos níveis\n\nTenha certeza de que o servidor está rodando: npm run editor');
    }
}

// Renderiza a lista de níveis
function renderLevelsList() {
    const list = document.getElementById('levels-list');
    list.innerHTML = '';

    levelsData.levels.forEach((level, index) => {
        const card = document.createElement('div');
        card.className = `box level-item-card ${index === currentLevelIndex ? 'active' : ''}`;
        card.style.padding = '0.75rem';
        card.style.marginBottom = '0.5rem';
        card.style.cursor = 'pointer';
        card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="flex: 1;">
                      <p class="heading is-6">${level.name}</p>
                      <p class="subtitle is-7">Nível ${level.id}</p>
                      <div class="tags">
                          <span class="tag is-light is-small">${level.difficulty}</span>
                      </div>
                  </div>
                  <div class="buttons are-small" style="margin-left: 0.5rem;">
                      <button class="button is-warning is-small" onclick="event.stopPropagation(); duplicateLevelByIndex(${index})" title="Duplicar nível">
                          <span class="icon"><i class="fas fa-copy"></i></span>
                      </button>
                      <button class="button is-danger is-small" onclick="event.stopPropagation(); deleteLevelByIndex(${index})" title="Deletar nível">
                          <span class="icon"><i class="fas fa-trash"></i></span>
                      </button>
                  </div>
              </div>
          `;
        card.onclick = () => selectLevel(index);
        list.appendChild(card);
    });
}

// Seleciona um nível
function selectLevel(index) {
    currentLevelIndex = index;
    currentElementIndex = null;
    renderLevelsList();
    renderElementsList();
    showLevelEditor();
}

// Renderiza a lista de elementos
function renderElementsList() {
    const container = document.getElementById('elements-list');
    container.innerHTML = '';

    if (currentLevelIndex === null) {
        container.innerHTML = '<p class="has-text-grey" style="font-size: 0.9rem;">Nenhum nível selecionado</p>';
        document.getElementById('add-element-container').style.display = 'none';
        document.getElementById('no-level-message').style.display = 'block';
        return;
    }

    document.getElementById('add-element-container').style.display = 'block';
    document.getElementById('no-level-message').style.display = 'none';

    const level = levelsData.levels[currentLevelIndex];
    level.elements.forEach((element, index) => {
        const card = document.createElement('div');
        card.className = `box ${index === currentElementIndex ? 'active' : ''} element-item-card`;
        card.style.padding = '0.75rem';
        card.style.marginBottom = '0.5rem';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.2s';
        card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <p class="heading is-7">${element.type}</p>
          <p class="subtitle is-7">${element.id}</p>
        </div>
        <div class="buttons are-small" style="margin-left: 0.5rem;">
          <button class="button is-info is-small" onclick="event.stopPropagation(); duplicateElementByIndex(${index})" title="Duplicar">
            <span class="icon"><i class="fas fa-copy"></i></span>
          </button>
          <button class="button is-danger is-small" onclick="event.stopPropagation(); deleteElementByIndex(${index})" title="Deletar">
            <span class="icon"><i class="fas fa-trash"></i></span>
          </button>
        </div>
      </div>
    `;
        card.onclick = () => selectElement(index);
        container.appendChild(card);
    });
}

// Seleciona um elemento
function selectElement(index) {
    currentElementIndex = index;
    renderElementsList();
    showElementEditor();
}

// Mostra o editor de nível
function showLevelEditor() {
    if (currentLevelIndex === null) {
        document.getElementById('no-selection').style.display = 'block';
        document.getElementById('level-editor').style.display = 'none';
        document.getElementById('element-editor').style.display = 'none';
        return;
    }

    const level = levelsData.levels[currentLevelIndex];
    document.getElementById('levelId').value = level.id;
    document.getElementById('levelName').value = level.name;
    document.getElementById('levelDescription').value = level.description;
    document.getElementById('levelObjective').value = level.objective;
    document.getElementById('levelDifficulty').value = level.difficulty;

    // Carregar dados de environment
    if (!level.environment) {
        level.environment = {
            preset: 'default',
            active: true,
            skyType: 'atmosphere',
            skyColor: '',
            horizonColor: '',
            lighting: 'distant',
            shadow: false,
            shadowSize: 10,
            lightPosition: '0 1 -0.2',
            fog: 0,
            flatShading: false,
            playArea: 1,
            stageSize: 200,
            ground: 'hills',
            groundYScale: 3,
            groundTexture: 'none',
            groundColor: '#553e35',
            groundColor2: '#694439',
            groundDensity: 64,
            groundFrequency: 10,
            dressing: 'none',
            dressingAmount: 10,
            dressingColor: '#795449',
            dressingScale: 5,
            dressingVariance: '1 1 1',
            dressingUniformScale: true,
            grid: 'none',
            gridColor: '#ccc',
            seed: 1,
        };
    }

    loadEnvironmentEditor(level.environment);

    document.getElementById('no-selection').style.display = 'none';
    document.getElementById('level-editor').style.display = 'block';
    document.getElementById('element-editor').style.display = 'none';

    // Listeners para atualizar dados gerais
    document.getElementById('levelId').onchange = e => {
        level.id = parseInt(e.target.value);
    };
    document.getElementById('levelName').onchange = e => {
        level.name = e.target.value;
        renderLevelsList();
    };
    document.getElementById('levelDescription').onchange = e => {
        level.description = e.target.value;
    };
    document.getElementById('levelObjective').onchange = e => {
        level.objective = e.target.value;
    };
    document.getElementById('levelDifficulty').onchange = e => {
        level.difficulty = e.target.value;
    };

    // Listeners para ambiente
    setupEnvironmentListeners(level.environment);
}

function switchTab(tabId, event) {
    event.preventDefault();

    // Esconder todas as abas
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => (c.style.display = 'none'));

    // Desativar todos os tabs
    const tabs = document.querySelectorAll('.tabs li');
    tabs.forEach(t => t.classList.remove('is-active'));

    // Mostrar aba selecionada
    document.getElementById(tabId).style.display = 'block';
    event.target.closest('li').classList.add('is-active');
}

function loadEnvironmentEditor(env) {
    // Parsear lightPosition se for string
    let lightPos = env.lightPosition;
    if (typeof lightPos === 'string') {
        const parts = lightPos.split(' ');
        document.getElementById('envLightX').value = parseFloat(parts[0]) || 0;
        document.getElementById('envLightY').value = parseFloat(parts[1]) || 0;
        document.getElementById('envLightZ').value = parseFloat(parts[2]) || 0;
    } else {
        document.getElementById('envLightX').value = 0;
        document.getElementById('envLightY').value = 1;
        document.getElementById('envLightZ').value = -0.2;
    }

    // Parsear dressingVariance
    let dressVar = env.dressingVariance;
    if (typeof dressVar === 'string') {
        const parts = dressVar.split(' ');
        document.getElementById('envDressingVarianceX').value = parseFloat(parts[0]) || 1;
        document.getElementById('envDressingVarianceY').value = parseFloat(parts[1]) || 1;
        document.getElementById('envDressingVarianceZ').value = parseFloat(parts[2]) || 1;
    } else {
        document.getElementById('envDressingVarianceX').value = 1;
        document.getElementById('envDressingVarianceY').value = 1;
        document.getElementById('envDressingVarianceZ').value = 1;
    }

    // Preencher campos
    document.getElementById('envActive').checked = env.active;
    document.getElementById('envPreset').value = env.preset;
    document.getElementById('envSeed').value = env.seed;
    document.getElementById('envSkyType').value = env.skyType;
    document.getElementById('envSkyColor').value = env.skyColor || '#87CEEB';
    document.getElementById('envHorizonColor').value = env.horizonColor || '#87CEEB';
    document.getElementById('envLighting').value = env.lighting;
    document.getElementById('envShadow').checked = env.shadow;
    document.getElementById('envShadowSize').value = env.shadowSize;
    document.getElementById('envGround').value = env.ground;
    document.getElementById('envGroundColor').value = env.groundColor;
    document.getElementById('envGroundColor2').value = env.groundColor2;
    document.getElementById('envGroundTexture').value = env.groundTexture;
    document.getElementById('envGroundYScale').value = env.groundYScale;
    document.getElementById('envGroundDensity').value = env.groundDensity;
    document.getElementById('envGroundFrequency').value = env.groundFrequency;
    document.getElementById('envDressing').value = env.dressing;
    document.getElementById('envDressingAmount').value = env.dressingAmount;
    document.getElementById('envDressingColor').value = env.dressingColor;
    document.getElementById('envDressingScale').value = env.dressingScale;
    document.getElementById('envDressingUniformScale').checked = env.dressingUniformScale;
    document.getElementById('envGrid').value = env.grid;
    document.getElementById('envGridColor').value = env.gridColor;
    document.getElementById('envFog').value = env.fog;
    document.getElementById('envFlatShading').checked = env.flatShading;
    document.getElementById('envPlayArea').value = env.playArea;
    document.getElementById('envStageSize').value = env.stageSize;
}

function setupEnvironmentListeners(env) {
    // Listeners para campos de environment
    document.getElementById('envActive').onchange = e => {
        env.active = e.target.checked;
    };
    document.getElementById('envPreset').onchange = e => {
        env.preset = e.target.value;
    };
    document.getElementById('envSeed').onchange = e => {
        env.seed = parseInt(e.target.value);
    };
    document.getElementById('envSkyType').onchange = e => {
        env.skyType = e.target.value;
    };
    document.getElementById('envSkyColor').onchange = e => {
        env.skyColor = e.target.value;
    };
    document.getElementById('envHorizonColor').onchange = e => {
        env.horizonColor = e.target.value;
    };
    document.getElementById('envLighting').onchange = e => {
        env.lighting = e.target.value;
    };
    document.getElementById('envShadow').onchange = e => {
        env.shadow = e.target.checked;
    };
    document.getElementById('envShadowSize').onchange = e => {
        env.shadowSize = parseInt(e.target.value);
    };

    // Light Position
    const updateLightPos = () => {
        const x = document.getElementById('envLightX').value || 0;
        const y = document.getElementById('envLightY').value || 0;
        const z = document.getElementById('envLightZ').value || 0;
        env.lightPosition = `${x} ${y} ${z}`;
    };
    document.getElementById('envLightX').onchange = updateLightPos;
    document.getElementById('envLightY').onchange = updateLightPos;
    document.getElementById('envLightZ').onchange = updateLightPos;

    document.getElementById('envGround').onchange = e => {
        env.ground = e.target.value;
    };
    document.getElementById('envGroundColor').onchange = e => {
        env.groundColor = e.target.value;
    };
    document.getElementById('envGroundColor2').onchange = e => {
        env.groundColor2 = e.target.value;
    };
    document.getElementById('envGroundTexture').onchange = e => {
        env.groundTexture = e.target.value;
    };
    document.getElementById('envGroundYScale').onchange = e => {
        env.groundYScale = parseFloat(e.target.value);
    };
    document.getElementById('envGroundDensity').onchange = e => {
        env.groundDensity = parseInt(e.target.value);
    };
    document.getElementById('envGroundFrequency').onchange = e => {
        env.groundFrequency = parseFloat(e.target.value);
    };
    document.getElementById('envDressing').onchange = e => {
        env.dressing = e.target.value;
    };
    document.getElementById('envDressingAmount').onchange = e => {
        env.dressingAmount = parseInt(e.target.value);
    };
    document.getElementById('envDressingColor').onchange = e => {
        env.dressingColor = e.target.value;
    };
    document.getElementById('envDressingScale').onchange = e => {
        env.dressingScale = parseFloat(e.target.value);
    };

    // Dressing Variance
    const updateDressVar = () => {
        const x = document.getElementById('envDressingVarianceX').value || 1;
        const y = document.getElementById('envDressingVarianceY').value || 1;
        const z = document.getElementById('envDressingVarianceZ').value || 1;
        env.dressingVariance = `${x} ${y} ${z}`;
    };
    document.getElementById('envDressingVarianceX').onchange = updateDressVar;
    document.getElementById('envDressingVarianceY').onchange = updateDressVar;
    document.getElementById('envDressingVarianceZ').onchange = updateDressVar;

    document.getElementById('envDressingUniformScale').onchange = e => {
        env.dressingUniformScale = e.target.checked;
    };
    document.getElementById('envGrid').onchange = e => {
        env.grid = e.target.value;
    };
    document.getElementById('envGridColor').onchange = e => {
        env.gridColor = e.target.value;
    };
    document.getElementById('envFog').onchange = e => {
        env.fog = parseFloat(e.target.value);
    };
    document.getElementById('envFlatShading').onchange = e => {
        env.flatShading = e.target.checked;
    };
    document.getElementById('envPlayArea').onchange = e => {
        env.playArea = parseFloat(e.target.value);
    };
    document.getElementById('envStageSize').onchange = e => {
        env.stageSize = parseInt(e.target.value);
    };
}

// Mostra o editor de elemento
function showElementEditor() {
    if (currentLevelIndex === null || currentElementIndex === null) {
        showLevelEditor();
        return;
    }

    const element = levelsData.levels[currentLevelIndex].elements[currentElementIndex];

    // Body Type
    const bodyTypeSelect = document.getElementById('bodyType');
    if (bodyTypeSelect) {
        bodyTypeSelect.value = (element.body && element.body.type) ? element.body.type : '';
    }

    // Body Mass
    const bodyMassInput = document.getElementById('bodyMass');
    if (bodyMassInput) {
        bodyMassInput.value = (element.body && typeof element.body.mass === 'number') ? element.body.mass : '';
    }

    document.getElementById('no-selection').style.display = 'none';
    document.getElementById('level-editor').style.display = 'none';
    document.getElementById('element-editor').style.display = 'block';

    // Preencher campos
    document.getElementById('elementId').value = element.id;
    document.getElementById('elementType').value = element.type;
    document.getElementById('posX').value = element.position.x;
    document.getElementById('posY').value = element.position.y;
    document.getElementById('posZ').value = element.position.z;
    document.getElementById('elementColor').value = element.color;
    document.getElementById('colorValue').textContent = element.color;
    document.getElementById('movable').checked = element.movable || false;
    document.getElementById('isStart').checked = element.isStart || false;
    document.getElementById('isTarget').checked = element.isTarget || false;

    // Campos minX, minY, maxX, maxY

    // Evitar mostrar 'NaN' nos campos
    document.getElementById('minX').value = (element.minX !== undefined && !isNaN(element.minX)) ? element.minX : '';
    document.getElementById('minY').value = (element.minY !== undefined && !isNaN(element.minY)) ? element.minY : '';
    document.getElementById('maxX').value = (element.maxX !== undefined && !isNaN(element.maxX)) ? element.maxX : '';
    document.getElementById('maxY').value = (element.maxY !== undefined && !isNaN(element.maxY)) ? element.maxY : '';

    document.getElementById('minX').onchange = e => {
        const v = e.target.value;
        element.minX = v === '' ? undefined : parseFloat(v);
    };
    document.getElementById('minY').onchange = e => {
        const v = e.target.value;
        element.minY = v === '' ? undefined : parseFloat(v);
    };
    document.getElementById('maxX').onchange = e => {
        const v = e.target.value;
        element.maxX = v === '' ? undefined : parseFloat(v);
    };
    document.getElementById('maxY').onchange = e => {
        const v = e.target.value;
        element.maxY = v === '' ? undefined : parseFloat(v);
    };

    // Mostrar/ocultar seções
    const rotationSection = document.getElementById('rotation-section');
    if (rotationSection) rotationSection.style.display = 'block';
    const dimensionsSection = document.getElementById('dimensions-section');
    if (dimensionsSection) dimensionsSection.style.display = 'block';
    // O campo de raio agora é sempre visível, não precisa mostrar/ocultar seção

    if (element.rotation) {
        document.getElementById('rotX').value = element.rotation.x;
        document.getElementById('rotY').value = element.rotation.y;
        document.getElementById('rotZ').value = element.rotation.z;
    }

    if (element.dimensions) {
        document.getElementById('dimWidth').value = element.dimensions.width;
        document.getElementById('dimHeight').value = element.dimensions.height;
        document.getElementById('dimDepth').value = element.dimensions.depth;
    }

    if (element.radius !== undefined) {
        document.getElementById('elementRadius').value = element.radius;
    }
}

// Funções de atualização
function updateElementField(field, value) {
    const element = levelsData.levels[currentLevelIndex].elements[currentElementIndex];
    if (field === 'movable' || field === 'isStart' || field === 'isTarget') {
        element[field] = value;
    } else if (field === 'radius') {
        element[field] = parseFloat(value);
    } else if (field === 'color') {
        element[field] = value;
        document.getElementById('colorValue').textContent = value;
    } else if (field === 'bodyType') {
        if (!element.body) element.body = {};
        element.body.type = value;
    } else if (field === 'bodyMass') {
        if (!element.body) element.body = {};
        element.body.mass = value === '' ? undefined : parseFloat(value);
    } else {
        element[field] = value;
    }
}

function updatePosition(axis, value) {
    const element = levelsData.levels[currentLevelIndex].elements[currentElementIndex];
    element.position[axis] = parseFloat(value);
}

function updateRotation(axis, value) {
    const element = levelsData.levels[currentLevelIndex].elements[currentElementIndex];
    if (!element.rotation) {
        element.rotation = { x: 0, y: 0, z: 0 };
    }
    element.rotation[axis] = parseFloat(value);
}

function updateDimension(dimension, value) {
    const element = levelsData.levels[currentLevelIndex].elements[currentElementIndex];
    element.dimensions[dimension] = parseFloat(value);
}

function duplicateElement() {
    const level = levelsData.levels[currentLevelIndex];
    const originalElement = level.elements[currentElementIndex];

    // Clone profundo do elemento
    const newElement = JSON.parse(JSON.stringify(originalElement));

    // Gerar novo ID único
    newElement.id = `${originalElement.id}-copy-${Date.now()}`;

    // Mover um pouco para não sobreposicionar
    newElement.position.x += 0.5;
    newElement.position.y += 0.5;

    // Adicionar à lista
    level.elements.push(newElement);

    // Selecionar o novo elemento
    currentElementIndex = level.elements.length - 1;
    renderElementsList();
    showElementEditor();
}

function duplicateElementByIndex(index) {
    currentElementIndex = index;
    duplicateElement();
}

function deleteElementByIndex(index) {
    if (confirm('Tem certeza que deseja deletar este elemento?')) {
        levelsData.levels[currentLevelIndex].elements.splice(index, 1);

        // Ajustar o índice atual se necessário
        if (currentElementIndex === index) {
            currentElementIndex = null;
            renderElementsList();
            showLevelEditor();
        } else if (currentElementIndex > index) {
            currentElementIndex--;
            renderElementsList();
        } else {
            renderElementsList();
        }
    }
}

function removeElement() {
    if (confirm('Tem certeza que deseja remover este elemento?')) {
        levelsData.levels[currentLevelIndex].elements.splice(currentElementIndex, 1);
        currentElementIndex = null;
        renderElementsList();
        showLevelEditor();
    }
}

function addElement() {
    const level = levelsData.levels[currentLevelIndex];
    const newElement = {
        id: `element-${Date.now()}`,
        type: 'cube',
        position: { x: null, y: null, z: null },
        rotation: { x: null, y: null, z: null },
        dimensions: { width: null, height: null, depth: null },
        color: '#ffffff',
        movable: false,
        body: { type: 'static' },
    };
    level.elements.push(newElement);
    renderElementsList();
}

function addNewLevel() {
    const newId = Math.max(...levelsData.levels.map(l => l.id)) + 1;
    const newLevel = {
        id: newId,
        name: `Novo Nível ${newId}`,
        difficulty: 'easy',
        objective: 'Descreva o objetivo',
        description: 'Descreva o nível',
        elements: [],
    };
    levelsData.levels.push(newLevel);
    renderLevelsList();
    selectLevel(levelsData.levels.length - 1);
}

function saveLevel() {
    if (currentLevelIndex === null) {
        alert('Selecione um nível primeiro');
        return;
    }
    const level = levelsData.levels[currentLevelIndex];
    level.id = parseInt(document.getElementById('levelId').value);
    level.name = document.getElementById('levelName').value;
    level.description = document.getElementById('levelDescription').value;
    level.objective = document.getElementById('levelObjective').value;
    level.difficulty = document.getElementById('levelDifficulty').value;

    fetch('http://localhost:3001/api/levels', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(levelsData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('✅ Nível salvo com sucesso!');
                renderLevelsList();
            } else {
                throw new Error(data.error);
            }
        })
        .catch(error => {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar!\n\nErro: ' + error.message);
        });
}

function downloadJSON() {
    const dataStr = JSON.stringify(levelsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'levels-data.json';
    link.click();
    URL.revokeObjectURL(url);
}

function deleteLevel() {
    if (currentLevelIndex === null) {
        alert('Selecione um nível primeiro');
        return;
    }
    if (confirm('Tem certeza que deseja deletar este nível?')) {
        levelsData.levels.splice(currentLevelIndex, 1);
        currentLevelIndex = null;
        currentElementIndex = null;
        renderLevelsList();
        showLevelEditor();
    }
}

function duplicateLevel() {
    if (currentLevelIndex === null) {
        alert('Selecione um nível primeiro');
        return;
    }

    const originalLevel = levelsData.levels[currentLevelIndex];

    // Clone profundo do nível
    const newLevel = JSON.parse(JSON.stringify(originalLevel));

    // Gerar novo ID único
    const newId = Math.max(...levelsData.levels.map(l => l.id)) + 1;
    newLevel.id = newId;
    newLevel.name = `${originalLevel.name} (Cópia)`;

    // Adicionar à lista
    levelsData.levels.push(newLevel);

    // Selecionar o novo nível
    currentLevelIndex = levelsData.levels.length - 1;
    currentElementIndex = null;
    renderLevelsList();
    renderElementsList();
    showLevelEditor();
}

function duplicateLevelByIndex(index) {
    const originalLevel = levelsData.levels[index];

    // Clone profundo do nível
    const newLevel = JSON.parse(JSON.stringify(originalLevel));

    // Gerar novo ID único
    const newId = Math.max(...levelsData.levels.map(l => l.id)) + 1;
    newLevel.id = newId;
    newLevel.name = `${originalLevel.name} (Cópia)`;

    // Adicionar à lista
    levelsData.levels.push(newLevel);

    // Selecionar o novo nível
    currentLevelIndex = levelsData.levels.length - 1;
    currentElementIndex = null;
    renderLevelsList();
    renderElementsList();
    showLevelEditor();
}

function deleteLevelByIndex(index) {
    if (confirm(`Tem certeza que deseja deletar o nível "${levelsData.levels[index].name}"?`)) {
        levelsData.levels.splice(index, 1);

        // Ajustar o índice atual se necessário
        if (currentLevelIndex === index) {
            currentLevelIndex = null;
            currentElementIndex = null;
            renderLevelsList();
            renderElementsList();
            showLevelEditor();
        } else if (currentLevelIndex > index) {
            currentLevelIndex--;
            renderLevelsList();
        } else {
            renderLevelsList();
        }
    }
}

function openBackupsModal() {
    document.getElementById('backups-modal').classList.add('is-active');
    loadBackups();
}
// Expor todas as funções relevantes para o escopo global (window)
window.openBackupsModal = openBackupsModal;
window.closeBackupsModal = closeBackupsModal;
window.downloadJSON = downloadJSON;
window.saveLevel = saveLevel;
window.duplicateLevel = duplicateLevel;
window.duplicateLevelByIndex = duplicateLevelByIndex;
window.deleteLevel = deleteLevel;
window.deleteLevelByIndex = deleteLevelByIndex;
window.addNewLevel = addNewLevel;
window.selectLevel = selectLevel;
window.renderLevelsList = renderLevelsList;
window.showLevelEditor = showLevelEditor;
window.renderElementsList = renderElementsList;
window.selectElement = selectElement;
window.showElementEditor = showElementEditor;
window.duplicateElement = duplicateElement;
window.duplicateElementByIndex = duplicateElementByIndex;
window.deleteElementByIndex = deleteElementByIndex;
window.removeElement = removeElement;
window.addElement = addElement;
window.updateElementField = updateElementField;
window.updatePosition = updatePosition;
window.updateRotation = updateRotation;
window.updateDimension = updateDimension;
window.backToGame = backToGame;

function closeBackupsModal() {
    document.getElementById('backups-modal').classList.remove('is-active');
}

async function loadBackups() {
    try {
        const response = await fetch('http://localhost:3001/api/backups');
        const backups = await response.json();

        const list = document.getElementById('backups-list');
        if (backups.length === 0) {
            list.innerHTML = '<p class="has-text-grey">Nenhum backup encontrado</p>';
            return;
        }

        // Ordena do mais recente para o mais antigo (assumindo que o nome tem timestamp)
        backups.sort((a, b) => parseInt(b.name.match(/\d+/)[0]) - parseInt(a.name.match(/\d+/)[0]));
        const recentBackups = backups.slice(0, 10);

        list.innerHTML = recentBackups
            .map(
                backup => `
              <div class="box" style="padding: 0.75rem; margin-bottom: 0.5rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                          <p class="is-size-7"><strong>${backup.name}</strong></p>
                          <p class="is-size-7 has-text-grey">${new Date(parseInt(backup.name.match(/\d+/)[0])).toLocaleString('pt-BR')}</p>
                      </div>
                      <button class="button is-small is-warning" onclick="restoreBackup('${backup.name}')">
                          <span class="icon"><i class="fas fa-undo"></i></span>
                      </button>
                  </div>
              </div>
          `
            )
            .join('');
    } catch (error) {
        console.error('Erro ao carregar backups:', error);
        document.getElementById('backups-list').innerHTML = '<p class="has-text-danger">Erro ao carregar backups</p>';
    }
}

async function restoreBackup(filename) {
    if (!confirm('Tem certeza que deseja restaurar este backup?')) return;

    try {
        const response = await fetch(`http://localhost:3001/api/restore/${filename}`, {
            method: 'POST',
        });
        const data = await response.json();

        if (data.success) {
            alert('✅ Backup restaurado com sucesso!');
            currentLevelIndex = null;
            currentElementIndex = null;
            closeBackupsModal();
            loadLevelsData();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        alert('❌ Erro ao restaurar: ' + error.message);
    }
}

function backToGame() {
    window.location.href = '../index.html';
}

// Inicializar
window.addEventListener('load', () => {
    loadLevelsData();
});
