// Cylinder Component - RGVR

AFRAME.registerComponent('cylinder-component', {
    dependencies: ['game-object'],
    
    init: function() {
        this.setupCylinder();
    },

    setupCylinder: function() {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const props = objectData.properties;
        
        // Configura geometria do cilindro
        this.el.setAttribute('geometry', {
            primitive: 'cylinder',
            radius: props?.radius || 0.5,
            height: props?.height || 1.5
        });
        
        // Adiciona detalhes visuais específicos do cilindro
        this.addTopRing();
        this.addBottomRing();
    },

    addTopRing: function() {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const height = objectData.properties?.height || 1.5;
        
        const topRing = document.createElement('a-torus');
        topRing.setAttribute('position', `0 ${height/2} 0`);
        topRing.setAttribute('radius', 0.6);
        topRing.setAttribute('radius-tubular', 0.05);
        topRing.setAttribute('material', {
            color: '#ffff00',
            metalness: 0.8,
            roughness: 0.2
        });
        
        this.el.appendChild(topRing);
    },

    addBottomRing: function() {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const height = objectData.properties?.height || 1.5;
        
        const bottomRing = document.createElement('a-torus');
        bottomRing.setAttribute('position', `0 ${-height/2} 0`);
        bottomRing.setAttribute('radius', 0.6);
        bottomRing.setAttribute('radius-tubular', 0.05);
        bottomRing.setAttribute('material', {
            color: '#ffff00',
            metalness: 0.8,
            roughness: 0.2
        });
        
        this.el.appendChild(bottomRing);
    }
});

console.log('Cylinder component loaded');