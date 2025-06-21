import HandsScene from './Existence/scenes/HandsScene.js';
import HopeDepressedScene from './Existence/scenes/HopeDepressedScene.js';
import HopeGameplayScene from './Existence/scenes/HopeGameplayScene.js';


window.addEventListener('DOMContentLoaded', () => {
  const aboutContainer = document.getElementById("aboutContainer");
  const aboutButton = document.getElementById("aboutButton");
  const closeAbout = document.getElementById("closeAbout");
  const startButton = document.getElementById("startButton");

  aboutButton.addEventListener("click", () => {
    aboutContainer.classList.toggle("visible");
  });

  closeAbout.addEventListener("click", () => {
    aboutContainer.classList.remove("visible");
  });

  startButton.addEventListener("click", () => {
  console.log('Iniciando a cena: hopeGameplay');

  const textContainer = document.querySelector('.text-container');
  const menu = document.querySelector('.menu');

  // Faz o texto sumir suavemente
  textContainer.classList.add('fade-out');

  // Faz o menu sumir suavemente
  menu.classList.add('fade-out');

  // Depois de meio segundo, oculta os dois de vez
  setTimeout(() => {
    textContainer.style.display = 'none';
    menu.style.display = 'none';
  }, 500);

  // Inicia a cena
  initScene('hopeGameplay');
});
});

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

// Inicializa já com a cena "hands"
initScene('hands');
