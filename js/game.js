// 核心游戏逻辑
const Game = {
  // 当前游戏状态
  state: {
    levelId: null,
    words: [],
    cards: [], // { id, text, type: 'chinese'|'english', pairId, matched }
    selectedCard: null,
    matchCount: 0,
    totalPairs: 0,
    timeLeft: 0,
    totalTime: 0,
    score: 0,
    timerInterval: null,
    isPlaying: false,
    isProcessing: false, // 正在处理配对结果，防止快速点击
  },

  // 初始化关卡
  initLevel(levelId) {
    const level = LEVEL_DATA.find((l) => l.id === levelId);
    if (!level) return false;

    this.reset();
    this.state.levelId = levelId;
    this.state.words = [...level.words];
    this.state.totalPairs = level.words.length;
    this.state.totalTime = level.timeLimit || GAME_CONFIG.defaultTimeLimit;
    this.state.timeLeft = this.state.totalTime;
    this.state.isPlaying = true;

    this.state.cards = [];
    level.words.forEach((word, idx) => {
      this.state.cards.push({
        id: `zh-${idx}`,
        text: word.zh,
        type: "chinese",
        pairId: idx,
        matched: false,
      });
      this.state.cards.push({
        id: `en-${idx}`,
        text: word.en,
        type: "english",
        pairId: idx,
        matched: false,
      });
    });

    // 随机打乱卡片顺序
    this.shuffleCards();

    // 启动计时器
    this.startTimer();

    return true;
  },

  // Fisher-Yates 洗牌算法
  shuffleCards() {
    const cards = this.state.cards;
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  },

  // 重置状态
  reset() {
    this.stopTimer();
    this.state = {
      levelId: null,
      words: [],
      cards: [],
      selectedCard: null,
      matchCount: 0,
      totalPairs: 0,
      timeLeft: 0,
      totalTime: 0,
      score: 0,
      timerInterval: null,
      isPlaying: false,
      isProcessing: false,
    };
  },

  // 计时器
  startTimer() {
    this.stopTimer();
    this.state.timerInterval = setInterval(() => {
      this.state.timeLeft--;
      UI.updateTimer();

      if (this.state.timeLeft <= 10 && this.state.timeLeft > 0) {
        AudioManager.playTick();
      }

      if (this.state.timeLeft <= 0) {
        this.gameOver();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }
  },

  // 点击卡片
  selectCard(cardId) {
    if (!this.state.isPlaying || this.state.isProcessing) return;

    const card = this.state.cards.find((c) => c.id === cardId);
    if (!card || card.matched) return;

    // 如果点击的是已选中的卡片，取消选择
    if (this.state.selectedCard && this.state.selectedCard.id === cardId) {
      this.state.selectedCard = null;
      UI.updateCards();
      return;
    }

    // 第一张卡片
    if (!this.state.selectedCard) {
      this.state.selectedCard = card;
      AudioManager.playSelect();
      if (card.type === "english") {
        AudioManager.speakEnglish(card.text);
      }
      UI.updateCards();
      return;
    }

    // 第二张卡片 - 检查配对
    this.state.isProcessing = true;
    const firstCard = this.state.selectedCard;

    if (card.type === "english") {
      AudioManager.speakEnglish(card.text);
    }

    // 必须是不同类型（一中一英）且属于同一对
    if (firstCard.type !== card.type && firstCard.pairId === card.pairId) {
      // 配对成功！
      this.handleMatch(firstCard, card);
    } else {
      // 配对失败
      this.handleMismatch(firstCard, card);
    }
  },

  // 配对成功
  handleMatch(card1, card2) {
    AudioManager.playMatch();

    // 标记为已消除
    card1.matched = true;
    card2.matched = true;
    this.state.matchCount++;

    // 计算得分：基础100分 + 剩余时间奖励
    const timeBonus = Math.floor(
      (this.state.timeLeft / this.state.totalTime) * 50,
    );
    this.state.score += 100 + timeBonus;

    this.state.selectedCard = null;

    UI.updateCards();
    UI.updateStats();

    // 检查是否全部消除
    setTimeout(() => {
      this.state.isProcessing = false;
      if (this.state.matchCount >= this.state.totalPairs) {
        this.levelComplete();
      }
    }, 400);
  },

  // 配对失败
  handleMismatch(card1, card2) {
    AudioManager.playFail();

    // 标记错误动画
    card1.wrongAnim = true;
    card2.wrongAnim = true;

    // 扣除时间
    this.state.timeLeft = Math.max(
      0,
      this.state.timeLeft - GAME_CONFIG.timePenalty,
    );

    this.state.selectedCard = null;

    UI.updateCards();
    UI.updateTimer();

    // 清除错误动画
    setTimeout(() => {
      card1.wrongAnim = false;
      card2.wrongAnim = false;
      UI.updateCards();
      this.state.isProcessing = false;

      // 检查时间是否归零
      if (this.state.timeLeft <= 0) {
        this.gameOver();
      }
    }, 500);
  },

  // 关卡完成
  levelComplete() {
    this.stopTimer();
    this.state.isPlaying = false;

    AudioManager.playLevelComplete();

    // 保存分数
    const playerName =
      Storage.getLeaderboard(this.state.levelId).length === 0 ? "" : "";
    const isNewRecord = Storage.saveScore(
      this.state.levelId,
      this.state.score,
      "", // 名字在弹窗中获取
      this.state.timeLeft,
    );

    // 解锁下一关
    const nextLevelId = this.state.levelId + 1;
    if (nextLevelId <= LEVEL_DATA.length) {
      Storage.unlockLevel(nextLevelId);
    }

    UI.showResult(true, isNewRecord);
  },

  // 游戏结束（时间耗尽）
  gameOver() {
    this.stopTimer();
    this.state.isPlaying = false;

    AudioManager.playTimeUp();

    UI.showResult(false, false);
  },

  // 重新开始当前关卡
  restart() {
    const levelId = this.state.levelId;
    this.initLevel(levelId);
    UI.initGameScreen(levelId);
  },
};
