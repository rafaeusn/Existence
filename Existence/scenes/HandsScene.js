import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js';
import { PixelShader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/shaders/PixelShader.js';

export default class HandsScene {
    constructor(renderer) {
        this.renderer = renderer; // Usa o renderer compartilhado
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();
        this.theta = 0;
        this.composer = null;

        this.resizeListener = this.onWindowResize.bind(this);
    }

    async init() {
        // --- VISUAL ATUALIZADO: Fundo e Névoa ---
        this.renderer.setClearColor(0x000000, 1);
        this.scene.fog = new THREE.FogExp2(0x11151c, 0.45); // Densidade da névoa atualizada
        
        // --- VISUAL ATUALIZADO: HDR ---
        const hdrEquirect = await new RGBELoader().loadAsync('https://miroleon.github.io/daily-assets/GRADIENT_01_01_comp.hdr');
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = hdrEquirect;

        // Carrega o modelo com o material e textura corretos
        await this.loadHandsModel();

        // --- VISUAL ATUALIZADO: Pós-processamento ---
        const renderPass = new RenderPass(this.scene, this.camera);
        
        const afterimagePass = new AfterimagePass();
        afterimagePass.uniforms['damp'].value = 0;

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.strength = 1.60;
        bloomPass.threshold = 0.1;
        bloomPass.radius = 1;

        const pixelPass = new ShaderPass(PixelShader);
        pixelPass.uniforms['resolution'].value = new THREE.Vector2(window.innerWidth, window.innerHeight);
        pixelPass.uniforms['resolution'].value.multiplyScalar(window.devicePixelRatio);
        pixelPass.uniforms['pixelSize'].value = 5;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(afterimagePass);
        this.composer.addPass(bloomPass);
        // this.composer.addPass(pixelPass); // O efeito Pixelado é forte, descomente se quiser usá-lo

        window.addEventListener('resize', this.resizeListener);
    }
    
    destroy() {
        console.log("Destruindo HandsScene");
        window.removeEventListener('resize', this.resizeListener);
        this.scene.traverse(object => {
            if (object.isMesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (object.material.roughnessMap) object.material.roughnessMap.dispose();
                    object.material.dispose();
                }
            }
        });
        this.scene.clear();
    }

    async loadHandsModel() {
        const loader = new FBXLoader();
        const hands = await loader.loadAsync('https://miroleon.github.io/daily-assets/two_hands_01.fbx');

        const textureLoader = new THREE.TextureLoader();
        const surfImp2 = await textureLoader.loadAsync('https://miroleon.github.io/daily-assets/surf_imp_02.jpg');
        surfImp2.wrapT = THREE.RepeatWrapping;
        surfImp2.wrapS = THREE.RepeatWrapping;

        hands.traverse(child => {
            if (child.isMesh) {
                // --- VISUAL ATUALIZADO: Propriedades do material ---
                child.material = new THREE.MeshPhysicalMaterial({
                    color: 0x606060,
                    roughness: 1.5,
                    metalness: 1.1,
                    roughnessMap: surfImp2,
                    envMap: this.scene.environment,
                    envMapIntensity: 0.9
                });
            }
        });

        hands.position.set(0, 0, 0);
        hands.scale.setScalar(0.05);
        this.scene.add(hands);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        
        if (this.composer) {
            const pixelPass = this.composer.passes.find(pass => pass.shader === PixelShader);
            if(pixelPass){
                 pixelPass.uniforms['resolution'].value.set(window.innerWidth, window.innerHeight).multiplyScalar(window.devicePixelRatio);
            }
        }
    }

    update() {
        // --- VISUAL ATUALIZADO: Movimento da Câmera ---
        this.theta += 0.005;
        this.camera.position.x = Math.sin(this.theta) * 2.3;
        this.camera.position.z = Math.cos(this.theta) * 2.3;
        this.camera.position.y = Math.sin(this.theta);
        this.camera.lookAt(0, 0, 0);
    }

    render() {
        if(this.composer) this.composer.render();
    }
}
