// Cube Component - RGVR

AFRAME.registerComponent('cube-component', {
    dependencies: ['game-object'],
    
    init: function() {
        this.setupCube();
    },

    setupCube: function() {
        // Configura geometria do cubo
        this.el.setAttribute('geometry', {
            primitive: 'box',
            width: 1,
            height: 1,
            depth: 1
        });
        
        // Adiciona detalhes visuais específicos do cubo
        this.addEdgeHighlights();
    },

    addEdgeHighlights: function() {
        // Cria wireframe para destacar bordas
        const wireframe = document.createElement('a-box');
        wireframe.setAttribute('position', '0 0 0');
        wireframe.setAttribute('scale', '1.02 1.02 1.02');
        wireframe.setAttribute('material', {
            color: '#ffffff',
            wireframe: true,
            opacity: 0.3,
            transparent: true
        });
        
        this.el.appendChild(wireframe);
    }
});

console.log('Cube component loaded');