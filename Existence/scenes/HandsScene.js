import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';
import { createRenderer, setupResize } from '../core/renderer.js';
import { createEnvironment, createFog } from '../core/lightning.js';
import { createComposer } from '../core/postprocessing.js';

export default class HandsScene {
    constructor() {
        this.renderer = createRenderer('canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();
        this.theta = 0;
    }

    async init() {
        // Resize responsivo
        setupResize(this.renderer, this.camera);

        // HDR + Fog
        this.scene.environment = await createEnvironment();
        this.scene.fog = createFog();

        // Carregar o modelo com material + textura
        await this.loadHandsModel();

        // Pós-processamento
        this.composer = createComposer(this.renderer, this.scene, this.camera);
    }

    async loadHandsModel() {
        const loader = new FBXLoader();
        const hands = await loader.loadAsync('https://miroleon.github.io/daily-assets/two_hands_01.fbx');

        // Textura de Roughness igual ao código antigo
        const textureLoader = new THREE.TextureLoader();
        const surfImp2 = textureLoader.load('https://miroleon.github.io/daily-assets/surf_imp_02.jpg');
        surfImp2.wrapT = THREE.RepeatWrapping;
        surfImp2.wrapS = THREE.RepeatWrapping;

        hands.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = new THREE.MeshPhysicalMaterial({
                    color: 0x606060,
                    roughness: 1.1,
                    metalness: 1.1,
                    roughnessMap: surfImp2,
                    envMap: this.scene.environment,
                    envMapIntensity: 2.2
                });
            }
        });

        hands.position.set(0, 0, 0);
        hands.scale.setScalar(0.05);
        this.scene.add(hands);
    }

    update() {
        this.theta += 0.004;
        this.camera.position.x = Math.sin(this.theta) * 2.3;
        this.camera.position.z = Math.cos(this.theta) * 2.3;
        this.camera.position.y = Math.sin(this.theta);
        this.camera.lookAt(0, 0, 0);
    }

    render() {
        this.composer.render();
    }
}
