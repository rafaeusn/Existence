import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';
import { createEndGameScreen } from '../utils/button-manager.js';

export default class HopeWinGameScene {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(170, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();
        
        // Propriedades da animação
        this.theta1 = 0;
        this.cameraStopped = false;
        this.stopTimer = 0;
        this.blobTransitionFinished = false;
        this.fovElapsed = 0;
        this.buttonCreated = false;

        // Guarda as referências das ações de animação
        this.body_01_action = null;
        this.eyes_01_action = null;

        this.resizeListener = this.onWindowResize.bind(this);
    }

    async init(sceneData = {}) {
        this.sceneData = sceneData;

        // Reset do estado da animação
        this.theta1 = 0;
        this.cameraStopped = false;
        this.stopTimer = 0;
        this.blobTransitionFinished = false;
        this.fovElapsed = 0;
        this.buttonCreated = false;
        this.camera.fov = 170;
        this.camera.updateProjectionMatrix();

        this.renderer.setClearColor(0x000000);
        this.camera.position.z = 70;
        this.camera.position.y = 80;

        const hdrEquirect = await new RGBELoader().loadAsync('https://miroleon.github.io/daily-assets/gradient_4_comp.hdr');
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = hdrEquirect;

        this.blob_mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0, envMap: hdrEquirect, envMapIntensity: 0.5 });
        this.uni_mat = new THREE.MeshPhysicalMaterial({ envMap: hdrEquirect, envMapIntensity: 0, emissive: 0x11151c });

        const scale = 0.03;
        const loader = new FBXLoader();
        
        const body_01 = await loader.loadAsync('https://miroleon.github.io/daily-assets/body_03.fbx');
        this.body_01_mixer = new THREE.AnimationMixer(body_01);
        this.body_01_action = this.body_01_mixer.clipAction(body_01.animations[0]);
        this.body_01_action.play();
        this.body_01_action.paused = true;

        body_01.traverse(child => { if (child.isMesh) child.material = this.blob_mat; });
        body_01.position.set(0, -5, 0);
        body_01.scale.setScalar(scale);
        this.scene.add(body_01);

        const eyes_01 = await loader.loadAsync('https://miroleon.github.io/daily-assets/eyes_03.fbx');
        this.eyes_01_mixer = new THREE.AnimationMixer(eyes_01);
        this.eyes_01_action = this.eyes_01_mixer.clipAction(eyes_01.animations[0]);
        this.eyes_01_action.play();
        this.eyes_01_action.paused = true; 

        eyes_01.traverse(child => { if (child.isMesh) child.material = this.uni_mat; });
        eyes_01.position.set(0, -5, 0);
        eyes_01.scale.setScalar(scale);
        this.scene.add(eyes_01);

        this.scene.fog = new THREE.FogExp2(0x11151c, 0.015);
        
        const renderScene = new RenderPass(this.scene, this.camera);
        const afterimagePass = new AfterimagePass();
        afterimagePass.uniforms['damp'].value = 0.85;

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.35, 1, 0.1);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(afterimagePass);
        this.composer.addPass(bloomPass);

        window.addEventListener('resize', this.resizeListener);
    }

    destroy() {
        console.log("Destruindo HopeWinGameScene");
        window.removeEventListener('resize', this.resizeListener);
        document.getElementById('game-over-screen')?.remove();
        this.scene.traverse(object => {
            if (object.isMesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) object.material.dispose();
            }
        });
        this.scene.clear();
    }

    update() {
        const delta = this.clock.getDelta();
        this.fovElapsed += delta;

        if(this.body_01_mixer) this.body_01_mixer.update(delta);
        if(this.eyes_01_mixer) this.eyes_01_mixer.update(delta);

        const totalDuration = 15;
        const initialFov = 170;
        const targetFov = 45;
        const initialIntensity = 0.5;
        const targetEnvMapIntensity = 10;
        
        const fovProgress = Math.min(this.fovElapsed / totalDuration, 1);
        this.camera.fov = THREE.MathUtils.lerp(initialFov, targetFov, fovProgress);
        this.camera.updateProjectionMatrix();

        if (this.camera.fov < 80) {
            const uniProgress = THREE.MathUtils.clamp((80 - this.camera.fov) / 20, 0, 1);
            this.uni_mat.envMapIntensity = THREE.MathUtils.lerp(0, 10, uniProgress);
        }
        if (this.camera.fov < 60) {
            const blobProgress = THREE.MathUtils.clamp((60 - this.camera.fov) / 15, 0, 1);
            this.blob_mat.envMapIntensity = THREE.MathUtils.lerp(initialIntensity, targetEnvMapIntensity, blobProgress);
            if (!this.blobTransitionFinished && blobProgress >= 1) {
                this.blobTransitionFinished = true;
                this.stopTimer = 0;
            }
        }

        if (this.blobTransitionFinished && !this.cameraStopped) {
            this.stopTimer += delta;
            if (this.stopTimer >= 5.9) {
                this.cameraStopped = true;
            }
        }
        
        if (this.cameraStopped && !this.buttonCreated) {
            this.buttonCreated = true;

            // --- LÓGICA PARA RECOMEÇAR A ANDAR ---
            if(this.body_01_action) this.body_01_action.paused = false;
            if(this.eyes_01_action) this.eyes_01_action.paused = false;
            
            createEndGameScreen(this.sceneData.message, this.sceneData.score, () => {
                window.dispatchEvent(new CustomEvent('changeScene', { 
                    detail: { sceneName: 'hopeGameplay' }
                }));
            });
        }

        if (!this.cameraStopped) {
            this.theta1 += 0.005;
        }

        this.camera.position.x = -Math.sin(this.theta1 + 1) * 45;
        this.camera.position.z = -Math.cos(this.theta1 + 1) * 25;
        this.camera.position.y = 20 * Math.cos(this.theta1 + 1) + 10;
        this.camera.lookAt(0, 5, 0);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        if (this.composer) this.composer.render();
    }
}
