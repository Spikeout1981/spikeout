// UI 管理
const UI = {
  // 初始化 AudioManager
  initAudio() {
    AudioManager.init();
  },

  // ========== 主菜单 ==========
  renderMenu() {
    this.switchScreen("menu-screen");
    this.renderLevelGrid();
    this.updateProgress();
  },

  // 渲染关卡选择网格
  renderLevelGrid() {
    const grid = document.getElementById("level-grid");
    const unlockedLevel = Storage.getUnlockedLevel();

    grid.innerHTML = LEVEL_DATA.map((level) => {
      const isUnlocked = level.id <= unlockedLevel;
      const highScore = Storage.getHighScore(level.id);
      const bestText = highScore > 0 ? `最佳: ${highScore}` : "";

      if (isUnlocked) {
        return `
                    <div class="level-card" onclick="App.startLevel(${level.id})">
                        <span class="star-icon">⭐</span>
                        <div class="level-number">${level.id}</div>
                        <div class="level-label">${level.name}</div>
                        ${bestText ? `<div class="level-best">${bestText}</div>` : ""}
                    </div>
                `;
      } else {
        return `
                    <div class="level-card locked">
                        <span class="lock-icon">🔒</span>
                        <div class="level-number">${level.id}</div>
                        <div class="level-label">${level.name}</div>
                    </div>
                `;
      }
    }).join("");
  },

  // 更新学习进度
  updateProgress() {
    const progress = Storage.getProgress();
    document.getElementById("progress-fill").style.width =
      progress.percent + "%";
    document.getElementById("progress-text").textContent =
      `${progress.completed}/${progress.total} 关已完成 (${progress.percent}%)`;
  },

  // ========== 游戏界面 ==========
  initGameScreen(levelId) {
    const level = LEVEL_DATA.find((l) => l.id === levelId);
    if (!level) return;

    this.switchScreen("game-screen");

    document.getElementById("level-name").textContent = level.name;
    document.getElementById("match-count").textContent = "0";
    document.getElementById("total-pairs").textContent = level.words.length;
    document.getElementById("level-high-score").textContent =
      Storage.getHighScore(levelId) || "-";

    this.updateTimer();
    this.renderCards();
  },

  // 渲染卡片
  renderCards() {
    const grid = document.getElementById("card-grid");
    const cards = Game.state.cards;

    grid.innerHTML = cards
      .map((card, index) => {
        let cls = "word-card";
        cls += ` ${card.type}`;

        if (card.matched) {
          cls += " matched";
        } else {
          if (card === Game.state.selectedCard) {
            cls += " selected";
          }
          if (card.wrongAnim) {
            cls += " wrong";
          }
        }

        return `
                <div class="${cls}"
                     data-card-id="${card.id}"
                     style="--float-delay: ${(index % 8) * 0.15}"
                     onclick="App.onCardClick('${card.id}')">
                    ${card.text}
                </div>
            `;
      })
      .join("");
  },

  // 更新卡片状态（不重建DOM）
  updateCards() {
    const grid = document.getElementById("card-grid");
    const cards = Game.state.cards;
    const cardElements = grid.querySelectorAll(".word-card");

    cardElements.forEach((el) => {
      const cardId = el.dataset.cardId;
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      // 重置class
      el.className = `word-card ${card.type}`;

      if (card.matched) {
        el.classList.add("matched");
      } else {
        if (card === Game.state.selectedCard) {
          el.classList.add("selected");
        }
        if (card.wrongAnim) {
          el.classList.add("wrong");
        }
      }
    });
  },

  // 更新计时器显示
  updateTimer() {
    const timeLeft = Game.state.timeLeft;
    const totalTime = Game.state.totalTime;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    document.getElementById("timer-text").textContent = timeStr;

    const timerBar = document.getElementById("timer-bar");
    const percentage = (timeLeft / totalTime) * 100;
    timerBar.style.width = percentage + "%";

    // 颜色变化
    timerBar.classList.remove("warning", "danger");
    if (percentage <= 20) {
      timerBar.classList.add("danger");
    } else if (percentage <= 40) {
      timerBar.classList.add("warning");
    }
  },

  // 更新游戏统计
  updateStats() {
    document.getElementById("match-count").textContent = Game.state.matchCount;
  },

  // ========== 结算弹窗 ==========
  showResult(isWin, isNewRecord) {
    const modal = document.getElementById("result-modal");
    const icon = document.getElementById("result-icon");
    const title = document.getElementById("result-title");
    const message = document.getElementById("result-message");
    const scoreDiv = document.getElementById("result-score");
    const nameArea = document.getElementById("name-input-area");
    const btnLeaderboard = document.getElementById("btn-leaderboard");
    const btnNext = document.getElementById("btn-next-level");
    const btnRetry = document.getElementById("btn-retry");
    const btnMenu = document.getElementById("btn-to-menu");

    if (isWin) {
      icon.textContent = "🎉";
      title.textContent = "太棒了！";
      message.textContent = `你完成了 ${LEVEL_DATA.find((l) => l.id === Game.state.levelId).name}`;
      scoreDiv.innerHTML = `得分: <strong>${Game.state.score}</strong>`;
      nameArea.style.display = "block";
      document.getElementById("player-name").value = "";
      btnLeaderboard.style.display = "inline-block";
      btnNext.style.display =
        Game.state.levelId < LEVEL_DATA.length ? "inline-block" : "none";
      btnRetry.style.display = "none";
    } else {
      icon.textContent = "⏰";
      title.textContent = "时间到！";
      message.textContent = "别灰心，再试一次吧！";
      scoreDiv.innerHTML = `已消除: <strong>${Game.state.matchCount}/${Game.state.totalPairs}</strong> 对`;
      nameArea.style.display = "none";
      btnLeaderboard.style.display = "none";
      btnNext.style.display = "none";
      btnRetry.style.display = "inline-block";
    }

    btnMenu.style.display = "inline-block";
    modal.classList.add("active");

    // 设置按钮事件
    btnLeaderboard.onclick = () => {
      this.saveResultAndShowLeaderboard();
    };

    btnNext.onclick = () => {
      modal.classList.remove("active");
      const nextLevelId = Game.state.levelId + 1;
      if (nextLevelId <= LEVEL_DATA.length) {
        App.startLevel(nextLevelId);
      }
    };

    btnRetry.onclick = () => {
      modal.classList.remove("active");
      Game.restart();
    };

    btnMenu.onclick = () => {
      modal.classList.remove("active");
      this.renderMenu();
    };
  },

  // 保存通关成绩并显示排行榜
  saveResultAndShowLeaderboard() {
    const playerName =
      document.getElementById("player-name").value.trim() || "匿名";

    // 重新保存带名字的成绩
    Storage.saveScore(
      Game.state.levelId,
      Game.state.score,
      playerName,
      Game.state.timeLeft,
    );

    document.getElementById("result-modal").classList.remove("active");
    this.showLeaderboard(Game.state.levelId);
  },

  // ========== 排行榜弹窗 ==========
  showLeaderboard(levelId) {
    const modal = document.getElementById("leaderboard-modal");
    const level = LEVEL_DATA.find((l) => l.id === levelId);

    document.getElementById("leaderboard-level-name").textContent = level
      ? level.name
      : "";

    const list = document.getElementById("leaderboard-list");
    const data = Storage.getLeaderboard(levelId);

    if (data.length === 0) {
      list.innerHTML =
        '<div class="leaderboard-empty">还没有记录，快来挑战吧！</div>';
    } else {
      list.innerHTML = data
        .map((entry, idx) => {
          let rankClass = "";
          let rankDisplay = idx + 1;
          if (idx === 0) rankClass = "gold";
          else if (idx === 1) rankClass = "silver";
          else if (idx === 2) rankClass = "bronze";

          const timeDisplay =
            entry.time !== undefined
              ? `${Math.floor(entry.time / 60)}:${String(entry.time % 60).padStart(2, "0")}`
              : "-";

          return `
                    <div class="leaderboard-item">
                        <span class="rank ${rankClass}">${rankDisplay}</span>
                        <span class="name">${entry.name}</span>
                        <span class="score">${entry.score}分</span>
                        <span class="time">剩余${timeDisplay}</span>
                    </div>
                `;
        })
        .join("");
    }

    modal.classList.add("active");

    // 关闭按钮事件（只绑定一次）
    const closeBtn = document.getElementById("btn-close-leaderboard");
    closeBtn.onclick = () => {
      modal.classList.remove("active");
      this.renderMenu();
    };
  },

  // ========== 工具方法 ==========
  switchScreen(screenId) {
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
  },
};
