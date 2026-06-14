// 应用主入口
const App = {
    // 初始化应用
    init() {
        // 初始化音频
        document.addEventListener('click', () => {
            AudioManager.init();
        }, { once: true });

        // 绑定返回按钮
        document.getElementById('btn-back').addEventListener('click', () => {
            Game.stopTimer();
            UI.renderMenu();
        });

        // 绑定重新开始按钮
        document.getElementById('btn-restart').addEventListener('click', () => {
            Game.restart();
        });

        // 渲染主菜单
        UI.renderMenu();
    },

    // 开始关卡
    startLevel(levelId) {
        const unlockedLevel = Storage.getUnlockedLevel();
        if (levelId > unlockedLevel) return;

        const success = Game.initLevel(levelId);
        if (success) {
            UI.initGameScreen(levelId);
        }
    },

    // 卡片点击
    onCardClick(cardId) {
        Game.selectCard(cardId);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});