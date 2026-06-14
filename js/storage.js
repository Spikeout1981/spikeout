// 本地存储管理
const Storage = {
    STORAGE_KEY: 'english_match_game',

    // 获取全部数据
    getData() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : this.getDefaultData();
        } catch (e) {
            return this.getDefaultData();
        }
    },

    // 保存全部数据
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
    },

    // 默认数据结构
    getDefaultData() {
        return {
            unlockedLevel: 1,              // 已解锁的最高关卡
            levels: {}                      // 每关数据: { 1: { highScore, leaderboard: [...] } }
        };
    },

    // 获取已解锁关卡
    getUnlockedLevel() {
        return this.getData().unlockedLevel;
    },

    // 解锁新关卡
    unlockLevel(levelId) {
        const data = this.getData();
        if (levelId > data.unlockedLevel) {
            data.unlockedLevel = levelId;
        }
        this.saveData(data);
    },

    // 获取关卡最高分
    getHighScore(levelId) {
        const data = this.getData();
        const levelData = data.levels[levelId];
        return levelData ? levelData.highScore || 0 : 0;
    },

    // 保存分数（如果是新纪录则返回 true）
    saveScore(levelId, score, playerName, timeLeft) {
        const data = this.getData();

        if (!data.levels[levelId]) {
            data.levels[levelId] = { highScore: 0, leaderboard: [] };
        }

        const levelData = data.levels[levelId];
        const isNewRecord = score > levelData.highScore;

        if (isNewRecord) {
            levelData.highScore = score;
        }

        // 添加到排行榜
        levelData.leaderboard.push({
            name: playerName || '匿名',
            score: score,
            time: timeLeft,
            date: new Date().toISOString().slice(0, 10)
        });

        // 按分数降序排列，取前N条
        levelData.leaderboard.sort((a, b) => b.score - a.score);
        levelData.leaderboard = levelData.leaderboard.slice(0, GAME_CONFIG.maxLeaderboardEntries);

        this.saveData(data);
        return isNewRecord;
    },

    // 获取排行榜
    getLeaderboard(levelId) {
        const data = this.getData();
        const levelData = data.levels[levelId];
        return levelData ? levelData.leaderboard || [] : [];
    },

    // 计算总进度
    getProgress() {
        const data = this.getData();
        const totalLevels = LEVEL_DATA.length;
        const completed = Object.keys(data.levels).filter(id => {
            return data.levels[id] && data.levels[id].highScore > 0;
        }).length;
        return { completed, total: totalLevels, percent: Math.round((completed / totalLevels) * 100) };
    },

    // 清除所有数据
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};