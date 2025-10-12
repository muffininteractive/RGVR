// Sphere Component - RGVR

AFRAME.registerComponent('sphere-component', {
    dependencies: ['game-object'],
    
    init: function() {
        this.setupSphere();
    },

    setupSphere: function() {
        const objectData = JSON.parse(this.el.getAttribute('game-object').objectData);
        const radius = objectData.properties?.radius || 1;
        
        // Configura geometria da esfera
        this.el.setAttribute('geometry', {
            primitive: 'sphere',
            radius: radius
        });
        
        // Adiciona detalhes visuais específicos da esfera
        this.addEnergyField();
    },

    addEnergyField: function() {
        // Cria campo de energia ao redor da esfera
        const energyField = document.createElement('a-sphere');
        energyField.setAttribute('position', '0 0 0');
        energyField.setAttribute('scale', '1.1 1.1 1.1');
        energyField.setAttribute('material', {
            color: '#00ffff',
            opacity: 0.2,
            transparent: true,
            shader: 'flat'
        });
        energyField.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            dur: 8000,
            loop: true
        });
        
        this.el.appendChild(energyField);
    }
});

console.log('Sphere component loaded');