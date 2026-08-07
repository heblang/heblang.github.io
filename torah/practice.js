'use strict';

(() => {
  const CHAPTERS = {
    genesis1: {
      source: '01_Bereshit_001.html', bookIndex: 0, chapterIndex: 0, verseCount: 31,
      book: 'Bereshit', chapter: 1, title: 'In the beginning', hebrew: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים',
      englishBook: 'Genesis', unitLabel: 'Day', theme: 'creation', mark: 'א',
      audioPrefix: '../../media/01_Bereshit_001_', groups: [
        [1, 5, 'Light', 'light'], [6, 8, 'The expanse', 'sky'], [9, 13, 'Land and seed', 'land'],
        [14, 19, 'Lights above', 'sun'], [20, 23, 'Water and wing', 'water'], [24, 31, 'Life on earth', 'life']
      ]
    },
    genesis2: {
      source: '01_Bereshit_002.html', bookIndex: 0, chapterIndex: 1, verseCount: 25,
      book: 'Bereshit', chapter: 2, title: 'Rest and the garden', hebrew: 'וַיְכֻלּוּ הַשָּׁמַיִם וְהָאָרֶץ',
      englishBook: 'Genesis', unitLabel: 'Movement', theme: 'garden', mark: 'ב',
      audioPrefix: '../../media/01_Bereshit_002_', groups: [
        [1, 3, 'Rest and blessing', 'light'], [4, 7, 'Breath of life', 'sky'],
        [8, 14, 'The garden and rivers', 'land'], [15, 17, 'The command', 'sun'],
        [18, 20, 'A fitting companion', 'water'], [21, 25, 'One flesh', 'life']
      ]
    },
    exodus20: {
      source: '../shemot/02_Shemot_020.html', bookIndex: 1, chapterIndex: 19, verseCount: 23,
      book: 'Shemot', chapter: 20, title: 'Words of covenant', hebrew: 'וַיְדַבֵּר אֱלֹהִים אֵת כָּל הַדְּבָרִים',
      englishBook: 'Exodus', unitLabel: 'Teaching', theme: 'sinai', mark: 'כ',
      audioPrefix: '../../media/02_Shemot_020_', groups: [
        [1, 2, 'The voice and covenant', 'light'], [3, 6, 'No other gods', 'sky'],
        [7, 11, 'Name and Sabbath', 'land'], [12, 17, 'Life with your neighbor', 'sun'],
        [18, 21, 'Awe at Sinai', 'water'], [22, 23, 'Worship in simplicity', 'life']
      ]
    },
    deuteronomy28: {
      source: '../devarim/05_Devarim_028.html', bookIndex: 4, chapterIndex: 27, verseCount: 69,
      book: 'Devarim', chapter: 28, title: 'Blessing and consequence', hebrew: 'וּבָאוּ עָלֶיךָ כָּל הַבְּרָכוֹת הָאֵלֶּה',
      englishBook: 'Deuteronomy', unitLabel: 'Passage', theme: 'covenant', mark: 'כח',
      audioPrefix: '../../media/05_Devarim_028_', groups: [
        [1, 6, 'Blessings near and far', 'light'], [7, 14, 'Abundance and purpose', 'sky'],
        [15, 24, 'Turning away', 'land'], [25, 35, 'Defeat and loss', 'sun'],
        [36, 44, 'Exile and reversal', 'water'], [45, 48, 'Why the warnings came', 'life'],
        [49, 57, 'The distant nation', 'sky'], [58, 63, 'Awe and consequence', 'sun'],
        [64, 69, 'Scattered among nations', 'water']
      ]
    }
  };

  const requestedChapterKey = document.body.dataset.chapterKey ||
    new URLSearchParams(window.location.search).get('chapter') || 'genesis1';
  const chapterKey = Object.prototype.hasOwnProperty.call(CHAPTERS, requestedChapterKey)
    ? requestedChapterKey
    : 'genesis1';
  const chapterConfig = CHAPTERS[chapterKey];
  const readerPath = document.body.dataset.readerPath || chapterConfig.source;
  const STORAGE_KEY = `torah-hebrew-${chapterKey}-progress-v1`;
  const TOTAL_VERSES = chapterConfig.verseCount;
  const DAY_GROUPS = buildDayGroups(chapterConfig);
  const CHAPTER_REFERENCE = `${chapterConfig.englishBook} ${chapterConfig.chapter}`;

  const elements = {
    app: document.getElementById('app'),
    trackView: document.getElementById('trackView'),
    lessonView: document.getElementById('lessonView'),
    completionView: document.getElementById('completionView'),
    errorView: document.getElementById('errorView'),
    errorMessage: document.getElementById('errorMessage'),
    pathLoading: document.getElementById('pathLoading'),
    lessonTrack: document.getElementById('lessonTrack'),
    verseStudio: document.getElementById('verseStudio'),
    studioStage: document.getElementById('studioStage'),
    studioMastery: document.getElementById('studioMastery'),
    studioContent: document.getElementById('studioContent'),
    streakCount: document.getElementById('streakCount'),
    xpCount: document.getElementById('xpCount'),
    masteryLabel: document.getElementById('masteryLabel'),
    masteryProgress: document.getElementById('masteryProgress'),
    masteryFill: document.getElementById('masteryFill'),
    nextGoal: document.getElementById('nextGoal'),
    closeLesson: document.getElementById('closeLesson'),
    lessonProgress: document.getElementById('lessonProgress'),
    lessonProgressFill: document.getElementById('lessonProgressFill'),
    focusMeter: document.getElementById('focusMeter'),
    exerciseEyebrow: document.getElementById('exerciseEyebrow'),
    exerciseTitle: document.getElementById('exerciseTitle'),
    exercisePrompt: document.getElementById('exercisePrompt'),
    exerciseContent: document.getElementById('exerciseContent'),
    answerBar: document.getElementById('answerBar'),
    answerMessage: document.getElementById('answerMessage'),
    checkAnswer: document.getElementById('checkAnswer'),
    completionTitle: document.getElementById('completionTitle'),
    completionSummary: document.getElementById('completionSummary'),
    earnedXp: document.getElementById('earnedXp'),
    lessonAccuracy: document.getElementById('lessonAccuracy'),
    nextVerseLabel: document.getElementById('nextVerseLabel'),
    returnToPath: document.getElementById('returnToPath')
  };

  const audio = new Audio();
  audio.preload = 'metadata';

  let chapter = [];
  let selectedNode = null;
  let currentLesson = null;
  let activeAudioVerse = 0;
  let progress = loadProgress();

  function buildDayGroups(config) {
    return config.groups.map(([start, end, title, tone], index) => ({ day: index + 1, title, start, end, tone }));
  }

  async function init() {
    bindEvents();
    document.body.dataset.practiceTheme = chapterConfig.theme;
    document.title = `Practice ${chapterConfig.englishBook} ${chapterConfig.chapter} | Torah Hebrew`;
    document.querySelector('meta[name="description"]').content =
      `Learn the Hebrew and meaning of ${CHAPTER_REFERENCE}, one verse at a time.`;
    document.querySelector('.brand').href = readerPath;
    document.querySelector('.brand').setAttribute('aria-label', `Return to ${chapterConfig.englishBook} ${chapterConfig.chapter} reader`);
    document.querySelector('.brand-mark').textContent = chapterConfig.mark;
    document.querySelector('.completion-medallion .heb').textContent = chapterConfig.mark;
    document.querySelector('.brand small').textContent = `${chapterConfig.book} · ${chapterConfig.englishBook} ${chapterConfig.chapter}`;
    document.querySelector('#chapterTitle').textContent = chapterConfig.title;
    document.querySelector('.chapter-hebrew').textContent = chapterConfig.hebrew;
    document.querySelector('.chapter-banner .eyebrow').textContent = `Torah Hebrew · ${chapterConfig.englishBook} ${chapterConfig.chapter}`;
    document.querySelector('.lesson-path').setAttribute('aria-label', `${chapterConfig.englishBook} ${chapterConfig.chapter} learning path`);
    document.querySelector('#pathLoading p').textContent = `Preparing ${chapterConfig.englishBook} ${chapterConfig.chapter}…`;
    document.querySelector('#errorMessage').textContent = `${CHAPTER_REFERENCE} could not be prepared.`;
    const errorLink = document.querySelector('#errorView a');
    errorLink.href = readerPath;
    errorLink.textContent = `Open ${CHAPTER_REFERENCE} reader`;

    try {
      chapter = await loadChapter();
      selectedNode = getNextNode() || { type: 'verse', verse: 1 };
      elements.pathLoading.hidden = true;
      elements.app.dataset.state = 'ready';
      renderDashboard();
    } catch (error) {
      console.error(error);
      showLoadError(error);
    }
  }

  async function loadChapter() {
    const timingChapter = window.tanakh && window.tanakh.books &&
      window.tanakh.books[chapterConfig.bookIndex] &&
      window.tanakh.books[chapterConfig.bookIndex][chapterConfig.chapterIndex];

    if (!Array.isArray(timingChapter) || timingChapter.length !== TOTAL_VERSES) {
      throw new Error(`${CHAPTER_REFERENCE} timing data is incomplete.`);
    }

    const response = await fetch(readerPath, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`${CHAPTER_REFERENCE} returned ${response.status}.`);
    }

    const sourceText = await response.text();
    const sourceDocument = new DOMParser().parseFromString(sourceText, 'text/html');
    const verseElements = Array.from(sourceDocument.querySelectorAll('main .verse'));

    if (verseElements.length !== TOTAL_VERSES) {
      throw new Error(`Expected ${TOTAL_VERSES} verses but found ${verseElements.length}.`);
    }

    return verseElements.map((verseElement, verseIndex) => {
      const verseNumber = verseIndex + 1;
      const timingVerse = timingChapter[verseIndex];
      const wordElements = Array.from(verseElement.querySelectorAll('.verse-text .col [id$="w"]'));

      const words = wordElements.map((wordElement) => {
        const match = wordElement.id.match(/^(\d+)-(\d+)w$/);
        if (!match) {
          throw new Error(`Unexpected word id '${wordElement.id}'.`);
        }

        const sourceVerseNumber = Number(match[1]);
        const wordNumber = Number(match[2]);
        const timingWord = timingVerse[wordNumber - 1];
        const cue = timingWord && timingWord.t;

        if (sourceVerseNumber !== verseNumber || !cue || !Number.isFinite(cue.s) || !Number.isFinite(cue.e)) {
          throw new Error(`Missing cue for ${CHAPTER_REFERENCE}:${verseNumber}, word ${wordNumber}.`);
        }

        const hebrewContainer = wordElement.closest('[lang="he"]');
        const englishElement = sourceDocument.getElementById(`${verseNumber}-${wordNumber}i`);
        const transliterationElement = sourceDocument.getElementById(`${verseNumber}-${wordNumber}t`);

        return {
          id: `${verseNumber}-${wordNumber}`,
          number: wordNumber,
          hebrew: normalizeText(hebrewContainer ? hebrewContainer.textContent : wordElement.textContent),
          english: normalizeText(englishElement ? englishElement.textContent : ''),
          transliteration: normalizeText(transliterationElement ? transliterationElement.textContent : ''),
          start: cue.s,
          end: cue.e
        };
      });

      if (words.length !== timingVerse.length) {
        throw new Error(`Text and timing counts differ for ${CHAPTER_REFERENCE}:${verseNumber}.`);
      }

      const hebrewNumberElement = verseElement.querySelector('.verse-number [lang="he"]');
      return {
        number: verseNumber,
        hebrewNumber: normalizeText(hebrewNumberElement ? hebrewNumberElement.textContent : ''),
        words,
        meaning: buildVerseMeaning(words)
      };
    });
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function buildVerseMeaning(words) {
    const meaning = words
      .map((word) => word.english)
      .filter((gloss) => gloss && gloss !== '-')
      .join(' ')
      .replace(/\s+([,.;:!?])/g, '$1');

    return meaning ? meaning.charAt(0).toUpperCase() + meaning.slice(1) : '';
  }

  function bindEvents() {
    elements.lessonTrack.addEventListener('click', handlePathClick);
    elements.verseStudio.addEventListener('click', handleStudioClick);
    elements.exerciseContent.addEventListener('click', handleExerciseClick);
    elements.checkAnswer.addEventListener('click', handleCheckAnswer);
    elements.closeLesson.addEventListener('click', leaveLesson);
    elements.returnToPath.addEventListener('click', returnToPath);

    document.addEventListener('keydown', handleKeydown);
    audio.addEventListener('timeupdate', updateWordHighlight);
    audio.addEventListener('play', syncAudioControls);
    audio.addEventListener('pause', syncAudioControls);
    audio.addEventListener('ended', clearAudioState);
    audio.addEventListener('error', handleAudioError);
  }

  function handlePathClick(event) {
    const button = event.target.closest('[data-node-type]');
    if (!button) {
      return;
    }

    const node = button.dataset.nodeType === 'review'
      ? { type: 'review', group: Number(button.dataset.group) }
      : { type: 'verse', verse: Number(button.dataset.verse) };

    selectedNode = node;
    stopAudio();
    renderTrack();
    renderStudio();
  }

  function handleStudioClick(event) {
    const startButton = event.target.closest('[data-start-lesson]');
    if (startButton) {
      startLesson(selectedNode);
      return;
    }

    handleSharedAudioClick(event);

    const speedButton = event.target.closest('[data-speed]');
    if (speedButton) {
      setPlaybackSpeed(Number(speedButton.dataset.speed));
      syncSpeedControls();
    }
  }

  function handleExerciseClick(event) {
    if (handleSharedAudioClick(event)) {
      return;
    }

    const speedButton = event.target.closest('[data-speed]');
    if (speedButton) {
      setPlaybackSpeed(Number(speedButton.dataset.speed));
      syncSpeedControls();
      return;
    }

    if (!currentLesson) {
      return;
    }

    const step = currentLesson.steps[currentLesson.stepIndex];
    if (step.answered) {
      return;
    }

    const optionButton = event.target.closest('[data-option-index]');
    if (optionButton) {
      selectOption(step, Number(optionButton.dataset.optionIndex));
      return;
    }

    const bankToken = event.target.closest('[data-bank-token]');
    if (bankToken && step.type === 'order') {
      step.selected.push(bankToken.dataset.bankToken);
      renderStep();
      return;
    }

    const answerToken = event.target.closest('[data-answer-index]');
    if (answerToken && step.type === 'order') {
      step.selected.splice(Number(answerToken.dataset.answerIndex), 1);
      renderStep();
    }
  }

  function handleSharedAudioClick(event) {
    const wordButton = event.target.closest('[data-play-word]');
    if (wordButton) {
      const verseNumber = Number(wordButton.dataset.verse);
      const wordNumber = Number(wordButton.dataset.word);
      const verse = chapter[verseNumber - 1];
      const word = verse && verse.words[wordNumber - 1];

      if (word) {
        playVerse(verseNumber, word.start);
        showWordMeaning(word);
      }
      return true;
    }

    const verseButton = event.target.closest('[data-play-verse]');
    if (verseButton) {
      playVerse(Number(verseButton.dataset.playVerse), 0, true);
      return true;
    }

    return false;
  }

  function showWordMeaning(word) {
    const insight = document.getElementById('studioWordMeaning');
    if (!insight) {
      return;
    }

    insight.innerHTML = `
      <strong class="heb" lang="he" dir="rtl">${escapeHtml(word.hebrew)}</strong>
      <span>${escapeHtml(word.transliteration)}</span>
      <span>${escapeHtml(displayGloss(word.english))}</span>
    `;
  }

  function handleKeydown(event) {
    if (elements.lessonView.hidden) {
      return;
    }

    if (event.key === 'Escape') {
      leaveLesson();
      return;
    }

    if (event.key === 'Enter' && !elements.checkAnswer.disabled) {
      event.preventDefault();
      elements.checkAnswer.click();
      return;
    }

    const optionNumber = Number(event.key);
    if (optionNumber >= 1 && optionNumber <= 4 && currentLesson) {
      const step = currentLesson.steps[currentLesson.stepIndex];
      if (!step.answered && Array.isArray(step.options) && step.options[optionNumber - 1]) {
        selectOption(step, optionNumber - 1);
      }
    }
  }

  function renderDashboard() {
    renderStats();
    renderTrack();
    renderStudio();
  }

  function renderStats() {
    const mastered = progress.completedVerses.length;
    const mastery = Math.round((mastered / TOTAL_VERSES) * 100);
    const next = getNextNode();

    elements.streakCount.textContent = String(progress.streak);
    elements.xpCount.textContent = String(progress.xp);
    elements.masteryLabel.textContent = `${mastery}%`;
    elements.masteryFill.style.width = `${mastery}%`;
    elements.masteryProgress.setAttribute('aria-valuenow', String(mastery));

    if (!next) {
      elements.nextGoal.textContent = 'Chapter path complete';
    } else if (next.type === 'review') {
      const group = DAY_GROUPS[next.group];
      elements.nextGoal.textContent = `Cumulative review · Verses 1–${group.end}`;
    } else {
      elements.nextGoal.textContent = `Verse ${next.verse} is ready`;
    }
  }

  function renderTrack() {
    elements.lessonTrack.innerHTML = DAY_GROUPS.map((group, groupIndex) => {
      const verseButtons = [];
      for (let verseNumber = group.start; verseNumber <= group.end; verseNumber += 1) {
        const verse = chapter[verseNumber - 1];
        const completed = isVerseCompleted(verseNumber);
        const unlocked = isVerseUnlocked(verseNumber);
        const selected = selectedNode && selectedNode.type === 'verse' && selectedNode.verse === verseNumber;
        const status = completed ? 'complete' : unlocked ? 'open' : 'locked';
        const offsetPattern = [-26, 4, 30, 8, -18];
        const offset = offsetPattern[(verseNumber - group.start) % offsetPattern.length];

        verseButtons.push(`
          <button class="path-node ${status}${selected ? ' selected' : ''}" type="button"
            data-node-type="verse" data-verse="${verseNumber}" data-status="${status}"
            style="--path-offset: ${offset}px"
            aria-label="Verse ${verseNumber}, ${status === 'complete' ? 'mastered' : status === 'open' ? 'available' : 'locked'}"
            aria-current="${selected ? 'step' : 'false'}" aria-disabled="${unlocked ? 'false' : 'true'}">
            <span class="node-orbit" aria-hidden="true"></span>
            <span class="node-core">${completed ? '✓' : verseNumber}</span>
            <span class="node-copy">
              <strong>Verse ${verseNumber}</strong>
              <small class="heb" lang="he" dir="rtl">${escapeHtml(verse.words[0].hebrew)}</small>
            </span>
          </button>
        `);
      }

      const reviewCompleted = isReviewCompleted(group);
      const reviewUnlocked = isReviewUnlocked(groupIndex);
      const reviewSelected = selectedNode && selectedNode.type === 'review' && selectedNode.group === groupIndex;
      const reviewStatus = reviewCompleted ? 'complete' : reviewUnlocked ? 'open' : 'locked';

      return `
        <section class="path-day" data-tone="${group.tone}" aria-labelledby="day-${group.day}-title">
          <header class="day-heading">
            <span class="day-number">${group.day}</span>
            <span>
              <small>${chapterConfig.unitLabel} ${group.day}</small>
              <h2 id="day-${group.day}-title">${group.title}</h2>
            </span>
            <span class="day-range">${group.start}–${group.end}</span>
          </header>
          <div class="verse-nodes">${verseButtons.join('')}</div>
          <button class="review-node ${reviewStatus}${reviewSelected ? ' selected' : ''}" type="button"
            data-node-type="review" data-group="${groupIndex}" data-status="${reviewStatus}"
            aria-label="Review verses 1 through ${group.end}, ${reviewStatus}"
            aria-current="${reviewSelected ? 'step' : 'false'}" aria-disabled="${reviewUnlocked ? 'false' : 'true'}">
            <span class="review-mark" aria-hidden="true">${reviewCompleted ? '✓' : '✦'}</span>
            <span><strong>Gather the words</strong><small>Review verses 1–${group.end}</small></span>
            <span class="review-status">${reviewCompleted ? 'Mastered' : reviewUnlocked ? 'Ready' : 'Locked'}</span>
          </button>
        </section>
      `;
    }).join('');
  }

  function renderStudio() {
    if (!selectedNode) {
      return;
    }

    if (selectedNode.type === 'review') {
      renderReviewStudio(selectedNode.group);
    } else {
      renderVerseStudio(selectedNode.verse);
    }
  }

  function renderVerseStudio(verseNumber) {
    const verse = chapter[verseNumber - 1];
    const completed = isVerseCompleted(verseNumber);
    const unlocked = isVerseUnlocked(verseNumber);

    elements.studioStage.textContent = `Verse ${verseNumber} of ${TOTAL_VERSES}`;
    elements.studioMastery.textContent = completed ? 'Mastered' : unlocked ? 'New' : 'Locked';
    elements.studioMastery.dataset.status = completed ? 'complete' : unlocked ? 'open' : 'locked';

    if (!unlocked) {
      const prerequisite = getVersePrerequisite(verseNumber);
      elements.studioContent.innerHTML = `
        <div class="locked-studio">
          <span class="locked-symbol" aria-hidden="true">${verseNumber}</span>
          <h2>Verse ${verseNumber} is ahead</h2>
          <p>${escapeHtml(prerequisite)}</p>
        </div>
      `;
      return;
    }

    elements.studioContent.innerHTML = `
      <div class="studio-verse-heading">
        <span class="verse-index">${verse.hebrewNumber || verseNumber}</span>
        <div>
          <p>${CHAPTER_REFERENCE}:${verseNumber}</p>
          <h2>${completed ? 'Strengthen this verse' : 'Learn this verse'}</h2>
        </div>
      </div>
      <div class="studio-words" dir="rtl" aria-label="${CHAPTER_REFERENCE} verse ${verseNumber}">
        ${renderWordButtons(verse, true)}
      </div>
      <div class="word-insight" id="studioWordMeaning">
        <strong class="heb" lang="he" dir="rtl">${escapeHtml(verse.words[0].hebrew)}</strong>
        <span>${escapeHtml(verse.words[0].transliteration)}</span>
        <span>${escapeHtml(displayGloss(verse.words[0].english))}</span>
      </div>
      <p class="verse-meaning">${escapeHtml(verse.meaning)}</p>
      <div class="studio-controls">
        ${renderAudioButton(verseNumber, `Hear verse ${verseNumber}`)}
        ${renderSpeedControl()}
      </div>
      <button class="primary-button studio-start" type="button" data-start-lesson>
        ${completed ? 'Practice again' : 'Start lesson'}
      </button>
    `;
  }

  function renderReviewStudio(groupIndex) {
    const group = DAY_GROUPS[groupIndex];
    const completed = isReviewCompleted(group);
    const unlocked = isReviewUnlocked(groupIndex);
    const learnedCount = progress.completedVerses.filter((verse) => verse <= group.end).length;

    elements.studioStage.textContent = `Cumulative review · ${chapterConfig.unitLabel} ${group.day}`;
    elements.studioMastery.textContent = completed ? 'Mastered' : unlocked ? 'Ready' : 'Locked';
    elements.studioMastery.dataset.status = completed ? 'complete' : unlocked ? 'open' : 'locked';

    if (!unlocked) {
      elements.studioContent.innerHTML = `
        <div class="locked-studio review-lock">
          <span class="locked-symbol" aria-hidden="true">${learnedCount}/${group.end}</span>
          <h2>Gather verses 1–${group.end}</h2>
          <p>Complete the open verse lessons in ${chapterConfig.unitLabel.toLowerCase()} ${group.day} first.</p>
        </div>
      `;
      return;
    }

    const sampleVerses = [1, Math.ceil(group.end / 2), group.end]
      .filter((value, index, values) => values.indexOf(value) === index);

    elements.studioContent.innerHTML = `
      <div class="review-studio-art" data-tone="${group.tone}" aria-hidden="true">
        ${sampleVerses.map((verse) => `<span>${verse}</span>`).join('')}
      </div>
      <p class="studio-overline">Verses 1–${group.end}</p>
      <h2>${completed ? 'Keep the chapter close' : 'Bring the verses together'}</h2>
      <p class="review-description">A mixed practice of listening, word meaning, recall, and verse order.</p>
      <div class="review-metrics">
        <span><strong>${group.end}</strong><small>verses</small></span>
        <span><strong>5</strong><small>challenges</small></span>
        <span><strong>${completed ? '10' : '30'}</strong><small>XP</small></span>
      </div>
      <button class="primary-button studio-start" type="button" data-start-lesson>
        ${completed ? 'Review again' : 'Begin review'}
      </button>
    `;
  }

  function renderWordButtons(verse, showTransliteration) {
    return verse.words.map((word) => `
      <button class="word-button" type="button" data-play-word data-verse="${verse.number}"
        data-word="${word.number}" title="Hear from ${escapeAttribute(word.transliteration || word.hebrew)}">
        <span class="hebrew-word heb" lang="he">${escapeHtml(word.hebrew)}</span>
        ${showTransliteration ? `<small>${escapeHtml(word.transliteration)}</small>` : ''}
      </button>
    `).join('');
  }

  function renderAudioButton(verseNumber, label) {
    return `
      <button class="listen-button" type="button" data-play-verse="${verseNumber}"
        aria-label="${escapeAttribute(label)}">
        <span class="play-symbol" aria-hidden="true"></span>
        <span>${escapeHtml(label)}</span>
      </button>
    `;
  }

  function renderSpeedControl() {
    const speeds = [0.75, 1, 1.25];
    return `
      <div class="speed-control" role="group" aria-label="Playback speed">
        ${speeds.map((speed) => `
          <button type="button" data-speed="${speed}" class="${progress.speed === speed ? 'active' : ''}"
            aria-pressed="${progress.speed === speed ? 'true' : 'false'}">${speed === 1 ? '1×' : `${speed}×`}</button>
        `).join('')}
      </div>
    `;
  }

  function isVerseCompleted(verseNumber) {
    return progress.completedVerses.includes(verseNumber);
  }

  function isVerseUnlocked(verseNumber) {
    if (verseNumber === 1 || isVerseCompleted(verseNumber)) {
      return true;
    }

    const groupIndex = DAY_GROUPS.findIndex((group) => verseNumber >= group.start && verseNumber <= group.end);
    const group = DAY_GROUPS[groupIndex];

    if (verseNumber === group.start && groupIndex > 0) {
      return isReviewCompleted(DAY_GROUPS[groupIndex - 1]);
    }

    return isVerseCompleted(verseNumber - 1);
  }

  function isReviewUnlocked(groupIndex) {
    const group = DAY_GROUPS[groupIndex];
    for (let verseNumber = group.start; verseNumber <= group.end; verseNumber += 1) {
      if (!isVerseCompleted(verseNumber)) {
        return false;
      }
    }
    return true;
  }

  function isReviewCompleted(group) {
    return progress.completedReviews.includes(group.end);
  }

  function getVersePrerequisite(verseNumber) {
    const groupIndex = DAY_GROUPS.findIndex((group) => verseNumber >= group.start && verseNumber <= group.end);
    const group = DAY_GROUPS[groupIndex];
    if (verseNumber === group.start && groupIndex > 0) {
      return `Finish the verses 1–${DAY_GROUPS[groupIndex - 1].end} review to open ${chapterConfig.unitLabel.toLowerCase()} ${group.day}.`;
    }
    return `Master verse ${verseNumber - 1} to continue.`;
  }

  function getNextNode() {
    for (let groupIndex = 0; groupIndex < DAY_GROUPS.length; groupIndex += 1) {
      const group = DAY_GROUPS[groupIndex];
      for (let verseNumber = group.start; verseNumber <= group.end; verseNumber += 1) {
        if (!isVerseCompleted(verseNumber) && isVerseUnlocked(verseNumber)) {
          return { type: 'verse', verse: verseNumber };
        }
      }

      if (!isReviewCompleted(group) && isReviewUnlocked(groupIndex)) {
        return { type: 'review', group: groupIndex };
      }
    }
    return null;
  }

  function startLesson(node) {
    if (!node || !isNodeUnlocked(node)) {
      return;
    }

    stopAudio();
    currentLesson = createLesson(node);
    elements.trackView.hidden = true;
    elements.completionView.hidden = true;
    elements.lessonView.hidden = false;
    elements.lessonView.scrollIntoView({ block: 'start' });
    renderStep();
  }

  function isNodeUnlocked(node) {
    return node.type === 'review' ? isReviewUnlocked(node.group) : isVerseUnlocked(node.verse);
  }

  function createLesson(node) {
    const steps = node.type === 'review'
      ? createReviewSteps(DAY_GROUPS[node.group])
      : createVerseSteps(chapter[node.verse - 1]);

    return {
      node,
      steps,
      stepIndex: 0,
      focus: 3,
      correct: 0,
      attempts: 0
    };
  }

  function createVerseSteps(verse) {
    return [
      { type: 'explore', verse },
      createMeaningStep(verse, verse.number * 17),
      createMeaningStep(verse, verse.number * 29 + 3),
      createOrderStep(verse, verse.number * 41),
      createClozeStep(verse, verse.number * 53)
    ];
  }

  function createReviewSteps(group) {
    const verseNumbers = uniqueValues([
      group.end,
      1,
      Math.ceil(group.end / 2),
      Math.max(1, group.end - 1),
      Math.ceil(group.end / 3)
    ]);

    while (verseNumbers.length < 5) {
      const candidate = verseNumbers.length + 1;
      if (!verseNumbers.includes(candidate) && candidate <= group.end) {
        verseNumbers.push(candidate);
      } else {
        break;
      }
    }

    const verses = verseNumbers.map((number) => chapter[number - 1]);
    return [
      createAudioChoiceStep(verses[0], group.end, group.end * 61),
      createMeaningStep(verses[1] || verses[0], group.end * 67),
      createClozeStep(verses[2] || verses[0], group.end * 71),
      createOrderStep(verses[3] || verses[0], group.end * 73),
      createAudioChoiceStep(verses[4] || verses[0], group.end, group.end * 79)
    ];
  }

  function createMeaningStep(verse, seed) {
    const candidates = verse.words.filter((word) => isUsefulGloss(word.english));
    const target = candidates[seed % candidates.length] || verse.words[0];
    const localGlosses = verse.words.filter((word) => isUsefulGloss(word.english));
    const chapterGlosses = chapter.flatMap((item) => item.words).filter((word) => isUsefulGloss(word.english));
    const distractors = uniqueBy(
      localGlosses.concat(seededShuffle(chapterGlosses, seed)),
      (word) => normalizeAnswer(word.english)
    )
      .filter((word) => normalizeAnswer(word.english) !== normalizeAnswer(target.english))
      .slice(0, 3)
      .map((word) => ({ value: word.english, label: displayGloss(word.english) }));

    const options = seededShuffle([
      { value: target.english, label: displayGloss(target.english) },
      ...distractors
    ], seed + 7);

    return {
      type: 'meaning',
      verse,
      target,
      options,
      answer: target.english,
      selection: null,
      answered: false
    };
  }

  function createClozeStep(verse, seed) {
    const target = verse.words[seed % verse.words.length];
    const localWords = verse.words.filter((word) => word.hebrew !== target.hebrew);
    const chapterWords = chapter.flatMap((item) => item.words);
    const distractors = uniqueBy(
      localWords.concat(seededShuffle(chapterWords, seed)),
      (word) => word.hebrew
    )
      .filter((word) => word.hebrew !== target.hebrew)
      .slice(0, 3)
      .map((word) => ({ value: word.hebrew, label: word.hebrew, hebrew: true }));

    return {
      type: 'cloze',
      verse,
      target,
      options: seededShuffle([
        { value: target.hebrew, label: target.hebrew, hebrew: true },
        ...distractors
      ], seed + 11),
      answer: target.hebrew,
      selection: null,
      answered: false
    };
  }

  function createOrderStep(verse, seed) {
    const phraseLength = Math.min(6, verse.words.length);
    const possibleStarts = Math.max(1, verse.words.length - phraseLength + 1);
    const start = seed % possibleStarts;
    const targetWords = verse.words.slice(start, start + phraseLength);
    let tokens = seededShuffle(targetWords, seed + 13);

    if (tokens.length > 1 && tokens.every((word, index) => word.id === targetWords[index].id)) {
      tokens = tokens.slice(1).concat(tokens[0]);
    }

    return {
      type: 'order',
      verse,
      targetWords,
      tokens,
      answer: targetWords.map((word) => word.id),
      selected: [],
      answered: false
    };
  }

  function createAudioChoiceStep(targetVerse, rangeEnd, seed) {
    const available = chapter.slice(0, rangeEnd).filter((verse) => verse.number !== targetVerse.number);
    const distractors = seededShuffle(available, seed).slice(0, 3);
    const options = seededShuffle([targetVerse, ...distractors], seed + 17).map((verse) => ({
      value: verse.number,
      label: verse.words.slice(0, Math.min(4, verse.words.length)).map((word) => word.hebrew).join(' '),
      hebrew: true
    }));

    return {
      type: 'audio-choice',
      verse: targetVerse,
      options,
      answer: targetVerse.number,
      selection: null,
      answered: false
    };
  }

  function renderStep() {
    if (!currentLesson) {
      return;
    }

    const step = currentLesson.steps[currentLesson.stepIndex];
    const progressPercent = Math.round((currentLesson.stepIndex / currentLesson.steps.length) * 100);
    elements.lessonProgressFill.style.width = `${progressPercent}%`;
    elements.lessonProgress.setAttribute('aria-valuenow', String(progressPercent));
    renderFocus();
    resetAnswerBar(step);

    switch (step.type) {
      case 'explore':
        renderExploreStep(step);
        break;
      case 'meaning':
        renderMeaningStep(step);
        break;
      case 'order':
        renderOrderStep(step);
        break;
      case 'cloze':
        renderClozeStep(step);
        break;
      case 'audio-choice':
        renderAudioChoiceStep(step);
        break;
      default:
        throw new Error(`Unknown lesson step '${step.type}'.`);
    }
  }

  function setExerciseHeading(eyebrow, title, promptHtml) {
    elements.exerciseEyebrow.textContent = eyebrow;
    elements.exerciseTitle.textContent = title;
    elements.exercisePrompt.innerHTML = promptHtml;
  }

  function renderExploreStep(step) {
    const verse = step.verse;
    setExerciseHeading(`${CHAPTER_REFERENCE}:${verse.number}`, 'Listen closely', 'Hear the verse, then trace it from any word.');
    elements.exerciseContent.innerHTML = `
      <div class="listen-stage">
        ${renderAudioButton(verse.number, `Hear verse ${verse.number}`)}
        ${renderSpeedControl()}
      </div>
      <div class="practice-verse" dir="rtl">
        ${renderWordButtons(verse, true)}
      </div>
      <p class="practice-meaning">${escapeHtml(verse.meaning)}</p>
    `;
  }

  function renderMeaningStep(step) {
    setExerciseHeading(
      `Word meaning · ${CHAPTER_REFERENCE}:${step.verse.number}`,
      'Choose the meaning',
      `<span class="prompt-word heb" lang="he" dir="rtl">${escapeHtml(step.target.hebrew)}</span>`
    );
    elements.exerciseContent.innerHTML = renderChoiceGrid(step.options, step.selection);
  }

  function renderClozeStep(step) {
    const verseMarkup = step.verse.words.map((word) => word.id === step.target.id
      ? '<span class="cloze-blank" aria-label="missing word">&nbsp;</span>'
      : `<span>${escapeHtml(word.hebrew)}</span>`
    ).join(' ');

    setExerciseHeading(`Recall · ${CHAPTER_REFERENCE}:${step.verse.number}`, 'Complete the verse', 'Choose the missing Hebrew word.');
    elements.exerciseContent.innerHTML = `
      <div class="cloze-verse heb" lang="he" dir="rtl">${verseMarkup}</div>
      ${renderChoiceGrid(step.options, step.selection)}
    `;
  }

  function renderOrderStep(step) {
    const selectedWords = step.selected.map((id) => step.targetWords.find((word) => word.id === id));
    const selectedCounts = step.selected.reduce((counts, id) => {
      counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {});
    const usedCounts = {};
    const remainingTokens = step.tokens.filter((word) => {
      usedCounts[word.id] = (usedCounts[word.id] || 0) + 1;
      return usedCounts[word.id] > (selectedCounts[word.id] || 0);
    });
    const phraseMeaning = buildVerseMeaning(step.targetWords);

    setExerciseHeading(`Word order · ${CHAPTER_REFERENCE}:${step.verse.number}`, 'Build the phrase', escapeHtml(phraseMeaning));
    elements.exerciseContent.innerHTML = `
      <div class="answer-slots" dir="rtl" aria-label="Your Hebrew phrase">
        ${selectedWords.length
          ? selectedWords.map((word, index) => `
              <button class="token-button answer-token heb" lang="he" type="button" data-answer-index="${index}">
                ${escapeHtml(word.hebrew)}
              </button>
            `).join('')
          : '<span class="slot-placeholder">···</span>'}
      </div>
      <div class="word-bank" dir="rtl" aria-label="Available Hebrew words">
        ${remainingTokens.map((word) => `
          <button class="token-button heb" lang="he" type="button" data-bank-token="${word.id}">
            ${escapeHtml(word.hebrew)}
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderAudioChoiceStep(step) {
    setExerciseHeading('Listening', 'Which verse did you hear?', 'Listen once or repeat at a slower speed.');
    elements.exerciseContent.innerHTML = `
      <div class="listen-stage large-listen">
        ${renderAudioButton(step.verse.number, 'Hear the verse')}
        ${renderSpeedControl()}
      </div>
      ${renderChoiceGrid(step.options, step.selection)}
    `;
  }

  function renderChoiceGrid(options, selection) {
    return `
      <div class="choice-grid">
        ${options.map((option, index) => `
          <button class="choice-button${valuesEqual(selection, option.value) ? ' selected' : ''}${option.hebrew ? ' hebrew-choice' : ''}"
            type="button" data-option-index="${index}" aria-pressed="${valuesEqual(selection, option.value) ? 'true' : 'false'}">
            <span class="choice-key" aria-hidden="true">${index + 1}</span>
            <span${option.hebrew ? ' class="heb" lang="he" dir="rtl"' : ''}>${escapeHtml(option.label)}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function selectOption(step, optionIndex) {
    const option = step.options[optionIndex];
    if (!option) {
      return;
    }

    step.selection = option.value;
    elements.exerciseContent.querySelectorAll('[data-option-index]').forEach((button) => {
      const selected = Number(button.dataset.optionIndex) === optionIndex;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    elements.checkAnswer.disabled = false;
  }

  function resetAnswerBar(step) {
    elements.answerBar.className = 'answer-bar';
    elements.answerMessage.textContent = '';
    elements.checkAnswer.textContent = step.type === 'explore' ? 'Continue' : 'Check';
    elements.checkAnswer.disabled = step.type !== 'explore' && !hasAnswer(step);
  }

  function hasAnswer(step) {
    if (step.type === 'order') {
      return step.selected.length === step.answer.length;
    }
    return step.selection !== null && step.selection !== undefined;
  }

  function handleCheckAnswer() {
    if (!currentLesson) {
      return;
    }

    const step = currentLesson.steps[currentLesson.stepIndex];
    if (step.type === 'explore') {
      advanceStep();
      return;
    }

    if (step.answered) {
      advanceStep();
      return;
    }

    if (!hasAnswer(step)) {
      return;
    }

    const correct = evaluateStep(step);
    step.answered = true;
    step.correct = correct;
    currentLesson.attempts += 1;

    if (correct) {
      currentLesson.correct += 1;
    } else {
      currentLesson.focus = Math.max(0, currentLesson.focus - 1);
    }

    revealAnswer(step, correct);
    renderFocus();
  }

  function evaluateStep(step) {
    if (step.type === 'order') {
      return step.answer.every((id, index) => step.selected[index] === id);
    }
    return valuesEqual(step.selection, step.answer);
  }

  function revealAnswer(step, correct) {
    stopAudio();
    elements.answerBar.classList.add(correct ? 'is-correct' : 'is-wrong');
    elements.checkAnswer.textContent = 'Continue';
    elements.checkAnswer.disabled = false;

    if (correct) {
      elements.answerMessage.innerHTML = '<strong>Correct</strong><span>The words are settling into place.</span>';
    } else {
      elements.answerMessage.innerHTML = `<strong>Take another look</strong><span>${escapeHtml(getCorrectAnswerText(step))}</span>`;
    }

    if (Array.isArray(step.options)) {
      elements.exerciseContent.querySelectorAll('[data-option-index]').forEach((button) => {
        const option = step.options[Number(button.dataset.optionIndex)];
        button.disabled = true;
        button.classList.toggle('is-correct', valuesEqual(option.value, step.answer));
        button.classList.toggle('is-wrong', !correct && valuesEqual(option.value, step.selection));
      });
    }

    if (step.type === 'order' && !correct) {
      elements.exerciseContent.insertAdjacentHTML('beforeend', `
        <div class="correction-phrase">
          <small>Correct order</small>
          <strong class="heb" lang="he" dir="rtl">${step.targetWords.map((word) => escapeHtml(word.hebrew)).join(' ')}</strong>
        </div>
      `);
      elements.exerciseContent.querySelectorAll('.token-button').forEach((button) => {
        button.disabled = true;
      });
    }
  }

  function getCorrectAnswerText(step) {
    if (step.type === 'meaning') {
      return `${step.target.transliteration}: ${displayGloss(step.target.english)}`;
    }
    if (step.type === 'cloze') {
      return `${step.target.hebrew} · ${step.target.transliteration}`;
    }
    if (step.type === 'audio-choice') {
      return `That was ${CHAPTER_REFERENCE}:${step.verse.number}.`;
    }
    return 'Read the phrase from right to left.';
  }

  function advanceStep() {
    stopAudio();
    currentLesson.stepIndex += 1;
    if (currentLesson.stepIndex >= currentLesson.steps.length) {
      completeLesson();
      return;
    }
    renderStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderFocus() {
    const remaining = currentLesson ? currentLesson.focus : 3;
    const dots = Array.from(elements.focusMeter.children);
    dots.forEach((dot, index) => dot.classList.toggle('spent', index >= remaining));
    elements.focusMeter.setAttribute('aria-label', `${remaining} focus point${remaining === 1 ? '' : 's'} remaining`);
  }

  function completeLesson() {
    const node = currentLesson.node;
    const accuracy = currentLesson.attempts
      ? Math.round((currentLesson.correct / currentLesson.attempts) * 100)
      : 100;
    const firstCompletion = node.type === 'review'
      ? !isReviewCompleted(DAY_GROUPS[node.group])
      : !isVerseCompleted(node.verse);
    const baseXp = node.type === 'review' ? (firstCompletion ? 30 : 10) : (firstCompletion ? 20 : 5);
    const earnedXp = baseXp + (accuracy === 100 ? 5 : 0);

    if (node.type === 'review') {
      const reviewEnd = DAY_GROUPS[node.group].end;
      progress.completedReviews = uniqueValues(progress.completedReviews.concat(reviewEnd)).sort((a, b) => a - b);
    } else {
      progress.completedVerses = uniqueValues(progress.completedVerses.concat(node.verse)).sort((a, b) => a - b);
    }

    progress.xp += earnedXp;
    updateStreak();
    saveProgress();

    const next = getNextNode();
    elements.lessonView.hidden = true;
    elements.completionView.hidden = false;
    elements.completionTitle.textContent = node.type === 'review'
      ? `Verses 1–${DAY_GROUPS[node.group].end} gathered`
      : `Verse ${node.verse} mastered`;
    elements.completionSummary.textContent = node.type === 'review'
      ? 'The earlier verses will return inside the next stage.'
      : 'You listened, read, recalled meaning, and rebuilt the Hebrew.';
    elements.earnedXp.textContent = `+${earnedXp}`;
    elements.lessonAccuracy.textContent = `${accuracy}%`;
    elements.nextVerseLabel.textContent = formatNodeLabel(next);

    selectedNode = next || node;
    currentLesson = null;
    renderStats();
    elements.completionView.scrollIntoView({ block: 'start' });
  }

  function returnToPath() {
    stopAudio();
    elements.completionView.hidden = true;
    elements.trackView.hidden = false;
    renderDashboard();

    requestAnimationFrame(() => {
      const selected = elements.lessonTrack.querySelector('[aria-current="step"]');
      if (selected) {
        selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  function leaveLesson() {
    stopAudio();
    currentLesson = null;
    elements.lessonView.hidden = true;
    elements.trackView.hidden = false;
    renderDashboard();
  }

  async function playVerse(verseNumber, startAt, toggleFromStart) {
    const verse = chapter[verseNumber - 1];
    if (!verse) {
      return;
    }

    const sameVerse = activeAudioVerse === verseNumber;
    if (toggleFromStart && sameVerse && !audio.paused) {
      audio.pause();
      return;
    }

    try {
      if (!sameVerse) {
        audio.src = getAudioPath(verseNumber);
        activeAudioVerse = verseNumber;
        audio.load();
        await waitForAudioMetadata();
      }

      audio.playbackRate = progress.speed;
      audio.currentTime = Math.max(0, Number(startAt) || 0);
      await audio.play();
      syncAudioControls();
      updateWordHighlight();
    } catch (error) {
      console.error(error);
      showToast(`Audio for verse ${verseNumber} could not be played.`);
    }
  }

  function waitForAudioMetadata() {
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Audio metadata failed to load.'));
      };
      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
      };

      audio.addEventListener('loadedmetadata', onLoaded, { once: true });
      audio.addEventListener('error', onError, { once: true });
    });
  }

  function getAudioPath(verseNumber) {
    return `${chapterConfig.audioPrefix}${String(verseNumber).padStart(3, '0')}.mp3`;
  }

  function setPlaybackSpeed(speed) {
    if (![0.75, 1, 1.25].includes(speed)) {
      return;
    }

    progress.speed = speed;
    audio.playbackRate = speed;
    saveProgress();
  }

  function syncSpeedControls() {
    document.querySelectorAll('[data-speed]').forEach((button) => {
      const active = Number(button.dataset.speed) === progress.speed;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function updateWordHighlight() {
    document.querySelectorAll('.word-button.is-speaking').forEach((button) => button.classList.remove('is-speaking'));
    if (!activeAudioVerse || audio.paused) {
      return;
    }

    const verse = chapter[activeAudioVerse - 1];
    const time = audio.currentTime;
    const word = verse.words.find((item, index) => {
      const next = verse.words[index + 1];
      return time >= item.start && time < (next ? next.start : item.end + 0.35);
    });

    if (!word) {
      return;
    }

    document.querySelectorAll(`.word-button[data-verse="${activeAudioVerse}"][data-word="${word.number}"]`)
      .forEach((button) => button.classList.add('is-speaking'));
  }

  function syncAudioControls() {
    document.querySelectorAll('[data-play-verse]').forEach((button) => {
      const isPlaying = Number(button.dataset.playVerse) === activeAudioVerse && !audio.paused;
      button.classList.toggle('is-playing', isPlaying);
      const text = button.querySelector('span:last-child');
      if (text) {
        if (!button.dataset.idleLabel) {
          button.dataset.idleLabel = text.textContent;
        }
        text.textContent = isPlaying ? 'Pause' : button.dataset.idleLabel;
      }
    });
  }

  function clearAudioState() {
    document.querySelectorAll('.word-button.is-speaking').forEach((button) => button.classList.remove('is-speaking'));
    syncAudioControls();
  }

  function stopAudio() {
    if (!audio.paused) {
      audio.pause();
    }
    clearAudioState();
  }

  function handleAudioError() {
    if (activeAudioVerse) {
      showToast(`Audio for verse ${activeAudioVerse} is unavailable.`);
    }
  }

  function showToast(message) {
    const existing = document.querySelector('.practice-toast');
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'practice-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function loadProgress() {
    const fallback = {
      completedVerses: [],
      completedReviews: [],
      xp: 0,
      streak: 0,
      lastPractice: null,
      speed: 1
    };

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || typeof stored !== 'object') {
        return fallback;
      }

      return {
        completedVerses: sanitizeNumberList(stored.completedVerses, 1, TOTAL_VERSES),
        completedReviews: sanitizeNumberList(stored.completedReviews, 1, TOTAL_VERSES),
        xp: Number.isFinite(stored.xp) && stored.xp >= 0 ? Math.floor(stored.xp) : 0,
        streak: Number.isFinite(stored.streak) && stored.streak >= 0 ? Math.floor(stored.streak) : 0,
        lastPractice: typeof stored.lastPractice === 'string' ? stored.lastPractice : null,
        speed: [0.75, 1, 1.25].includes(stored.speed) ? stored.speed : 1
      };
    } catch (error) {
      return fallback;
    }
  }

  function sanitizeNumberList(value, min, max) {
    if (!Array.isArray(value)) {
      return [];
    }
    return uniqueValues(value
      .filter((item) => Number.isInteger(item) && item >= min && item <= max))
      .sort((a, b) => a - b);
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      // Practice remains usable when storage is blocked.
    }
  }

  function updateStreak() {
    const today = localDateKey(new Date());
    if (progress.lastPractice === today) {
      return;
    }

    if (progress.lastPractice) {
      const previous = parseLocalDate(progress.lastPractice);
      const current = parseLocalDate(today);
      const dayDifference = Math.round((current - previous) / 86400000);
      progress.streak = dayDifference === 1 ? progress.streak + 1 : 1;
    } else {
      progress.streak = 1;
    }
    progress.lastPractice = today;
  }

  function localDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function parseLocalDate(value) {
    const parts = value.split('-').map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function showLoadError(error) {
    elements.app.dataset.state = 'error';
    elements.trackView.hidden = true;
    elements.lessonView.hidden = true;
    elements.completionView.hidden = true;
    elements.errorView.hidden = false;
    elements.errorMessage.textContent = window.location.protocol === 'file:'
      ? `Open this page from a local web server so it can read the ${CHAPTER_REFERENCE} data.`
      : error.message;
  }

  function displayGloss(value) {
    return normalizeText(value).replace(/^\[(.*)\]$/, '$1');
  }

  function isUsefulGloss(value) {
    const normalized = normalizeAnswer(value);
    return Boolean(normalized && normalized !== '-');
  }

  function normalizeAnswer(value) {
    return normalizeText(value).toLocaleLowerCase().replace(/[\[\]]/g, '');
  }

  function seededShuffle(items, seed) {
    const shuffled = items.slice();
    let state = Math.abs(Number(seed) || 1);
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      state = (state * 9301 + 49297) % 233280;
      const swapIndex = Math.floor((state / 233280) * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function uniqueValues(values) {
    return Array.from(new Set(values));
  }

  function uniqueBy(values, getKey) {
    const seen = new Set();
    return values.filter((value) => {
      const key = getKey(value);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  function valuesEqual(left, right) {
    return String(left) === String(right);
  }

  function formatNodeLabel(node) {
    if (!node) {
      return 'Complete';
    }
    if (node.type === 'review') {
      return `Review 1–${DAY_GROUPS[node.group].end}`;
    }
    return `Verse ${node.verse}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  init();
})();