import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

export default class CameraController {
    constructor(type = 'perspective', params = {}) {
        this.type = type;
        this.params = params;
        this.camera = this.createCamera();
        this.orbitControls = null;
        this.theta = 0;
    }
    
    createCamera() {
        switch(this.type) {
            case 'perspective':
            default:
                return new THREE.PerspectiveCamera(
                    this.params.fov || 45,
                    window.innerWidth / window.innerHeight,
                    this.params.near || 0.1,
                    this.params.far || 1000
                );
        }
    }
    
    // Configurações pré-definidas para suas cenas
    setupSceneCamera(sceneType) {
        switch(sceneType) {
            case 'hands':
                this.camera.position.set(0, 0, 10);
                break;
                
            case 'hopeDepressed':
                this.camera.position.set(0, 10, 45);
                this.camera.lookAt(0, 6.5, 0);
                break;
                
            case 'hopeGameplay':
                this.camera.position.z = 20;
                this.camera.position.y = 40;
                break;
        }
    }
    
    // Movimento circular automático (usado na cena Hands)
    circularMotion(radius = 3, speed = 0.005, heightVariation = 1) {
        this.theta += speed;
        this.camera.position.x = Math.sin(this.theta) * radius;
        this.camera.position.z = Math.cos(this.theta) * radius;
        this.camera.position.y = Math.sin(this.theta) * heightVariation;
        this.camera.lookAt(0, 0, 0);
    }
    
    // Movimento orbital (usado na cena HopeGameplay)
    orbitalMotion(radius = 45, height = 20, speed = 0.005) {
        this.theta += speed;
        this.camera.position.x = -Math.sin(this.theta + 1) * radius;
        this.camera.position.z = -Math.cos(this.theta + 1) * radius;
        this.camera.position.y = height * Math.cos(this.theta + 1) + height;
        this.camera.lookAt(0, 5, 0);
    }
    
    // Movimento linear (usado na cena HopeDepressed)
    linearMovement(speed = 5.5) {
        this.camera.position.z -= speed * deltaTime;
    }
    
    // Atualizar aspect ratio no redimensionamento
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}