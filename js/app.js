// 应用主入口
const App = {
  init() {
    if (window.speechSynthesis) {
      AudioManager.synth = window.speechSynthesis;
      AudioManager.loadVoices();
    }

    document.addEventListener(
      "click",
      () => {
        AudioManager.init();
      },
      { once: true },
    );

    document.getElementById("btn-back").addEventListener("click", () => {
      Game.stopTimer();
      UI.renderMenu();
    });

    document.getElementById("btn-restart").addEventListener("click", () => {
      Game.restart();
    });

    UI.renderMenu();
  },

  startLevel(levelId) {
    const unlockedLevel = Storage.getUnlockedLevel();
    if (levelId > unlockedLevel) return;

    const success = Game.initLevel(levelId);
    if (success) {
      UI.initGameScreen(levelId);
    }
  },

  onCardClick(cardId) {
    Game.selectCard(cardId);
  },
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
