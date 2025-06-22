const aboutContainer = document.getElementById("aboutContainer");
const startButton = document.getElementById("startButton");
const aboutButton = document.getElementById("aboutButton");
const closeAbout = document.getElementById("closeAbout");
const preloader = document.getElementById("preloader");

// Garante que o preloader comece escondido
preloader.style.display = "none";

// Função para carregar scripts modulares com callback
function loadScriptSafely(newSrc, onLoadCallback) {
  const oldScript = document.getElementById("dynamicScript");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.type = "module";
  script.src = newSrc;
  script.id = "dynamicScript";

  if (onLoadCallback) {
    script.onload = onLoadCallback;
  }

  document.body.appendChild(script);
}

aboutButton.addEventListener("click", () => {
  aboutContainer.classList.toggle("visible");
});

closeAbout.addEventListener("click", () => {
  aboutContainer.classList.remove("visible");
});

startButton.addEventListener("click", () => {
  aboutContainer.classList.remove("visible");
  document.querySelector(".menu").style.display = "none";
  document.querySelector(".text-container").style.display = "none";

  preloader.style.display = "flex";

  loadScriptSafely("hopegameplay.js", () => {
    setTimeout(() => {
      preloader.style.display = "none";
    }, 2000);
  });
});
