import HandsScene from './Existence/scenes/HandsScene.js';
import HopeDepressedScene from './Existence/scenes/HopeDepressedScene.js';
import HopeGameplayScene from './Existence/scenes/HopeGameplayScene.js';

console.log('Existence game loaded');

const scenes = {
    hands: new HandsScene(),
    hopeDepressed: new HopeDepressedScene(),
    hopeGameplay: new HopeGameplayScene()
};

let currentScene = null;

async function initScene(sceneName) {
    if (currentScene) {
        console.log(`Mudando para a cena: ${sceneName}`);
        // Limpeza da cena anterior se necessário
    }
    
    currentScene = scenes[sceneName];
    await currentScene.init();
    
    document.getElementById('preloader').style.display = 'none';
    animate();
}

function animate() {
    currentScene.update();
    currentScene.render();
    requestAnimationFrame(animate);
}

initScene('hands'); // Inicia com a cena de gameplay

// Controle do menu
document.getElementById('startButton').addEventListener('click', () => {
    console.log('Iniciando a cena: hands');
    document.querySelector('.menu').style.display = 'none';
    initScene('hopeGameplay');
});

document.getElementById('aboutButton').addEventListener('click', () => {
    console.log('Abrindo a seção Sobre');
    document.getElementById('aboutContainer').classList.toggle('visible');
});

document.getElementById('closeAbout').addEventListener('click', () => {
    console.log('Fechando a seção Sobre');
    document.getElementById('aboutContainer').style.display = 'none';
});