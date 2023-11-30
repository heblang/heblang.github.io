'use strict';

document.addEventListener('pageCompleted', (event) => {
  class Player {
    constructor() {
      this.regularPlaylist = this.loadPlaylist();
      this.pausePlaylist = null; // load upon request only
      this.playlist = this.regularPlaylist;
      this.highlighted = {};
      this.paused = {};
      for (let i = 1; i < this.playlist.length; i++) {
        this.highlighted[i] = {};
        this.paused[i] = {}
      }
      this.index = 1;
      this.requestHighlightId = 0;
      this.startWord = 1; // to prevent pausing before saying the word
    }
    get sound() {
      return this.playlist[this.index].howl;
    }
    step() {
      const self = this;
      const sound = self.sound;
      if (!sound.playing()) {
        return;
      }

      // Determine our current seek position.
      const seek = sound.seek() || 0;
      const verseCues = page.cues[self.index];
      for (let i = this.findClosestIndex(seek); i < verseCues.length; i++) {
        if (i <= 0) {
          break;
        }

        if (i in self.highlighted[self.index]) { // word already highlighted, move on
          if (usePauseTimer() && seek > (getCueEnd(verseCues, i) + 0.3) && !self.paused[self.index][i] && sound.playing()) {
            sound.pause();
            self.paused[self.index][i] = true;
            const currentIndex = self.index;
            self.wordTimeout = setTimeout(() => {
              if (currentIndex == self.index) {
                sound.play();
              }
            }, getPauseTime());
          }
          break;
        }

        // word needs to be highlighted
        let id = `${self.index}-${i}`;
        let elems = self.highlighted[self.index][i] = [];
        for (const key in page.elements) {
          let elem = page.elements[key][id];
          elem.classList.add('highlight');
          elems.push(elem);
        }
        break;
      }
    }
    play() {
      const sound = this.sound;
      if (!sound.playing()) {
        sound.play();
        enable('pauseBtn');
      }
      if (!this.requestHighlightId) {
        this.requestHighlight();
      }
    }
    pause() {
      this.sound.pause();
      enable('playBtn');
    }
    skip(direction) {
      // Get the next track based on the direction of the track.
      let index = 1;
      if (direction === 'prev') {
        index = this.index - 1;
        if (index < 1 || index < parseInt(controls.startVerse.value)) {
          index = controls.endVerse.value;
          if (controls.loop.checked) {
            this.skipTo(index);
          }
          else {
            this.index = index;
          }
        }
        else {
          this.skipTo(index);
        }
      } else {
        index = this.index + 1;
        if (index >= this.playlist.length || index > parseInt(controls.endVerse.value)) {
          index = parseInt(controls.startVerse.value);
          if (controls.loop.checked) {
            this.skipTo(index);
          }
          else {
            this.index = index;
          }
        }
        else {
          this.skipTo(index);
        }
      }
    }
    skipTo(index, position) {
      if (!position) {
        this.startWord = 1;
      }

      this.clearHighlighted();
      let sound = this.sound;
      if (this.index != index) {
        sound.pause();
        sound.seek(0);

        this.index = index;
        sound = this.sound // new sound
      }

      if (position) {
        sound.seek(position);
      }

      this.play();
    }
    volume(val) {
      // Update the global volume (affecting all Howls).
      Howler.volume(val);

      // Update the display on the slider.
      let barWidth = (val * 90) / 100;
      controls.barFull.style.width = (barWidth * 100) + '%';
      controls.sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
    }
    rate(rate) {
      // enumerate Howls and set the rate for all.
      for (let i = 1; i < this.regularPlaylist.length; i++) {
        this.regularPlaylist.playlist[i].howl.rate(rate);
      }
      if (!this.pausePlaylist) {
        return;
      }
      for (let i = 1; i < this.pausePlaylist.length; i++) {
        this.pausePlaylist.playlist[i].howl.rate(rate);
      }
    }
    loadPlaylist(rate) {
      const self = this;
      const book = page.info.book.p;
      const bookNo = page.info.book.n.toString().padStart(2, '0');
      const chapterNo = page.info.chapter.n.toString().padStart(3, '0');
      const playlist = [{}]; // 1 based index
      const playlistLength = page.cues.length - 1;
      const ext = [page.isMobileEdge ? 'mp3' : 'm4a', page.isMobileEdge ? 'm4a' : 'mp3'];
      const usePause = hasPause();
      let unloadedTracks = playlistLength;
      let audioPrefix = '';

      if (usePause) {
        controls.loadingScreen.style.display = 'block';
        audioPrefix = 'P_';
      }

      for (let i = 1; i <= playlistLength; i++) {
        const verseNo = i.toString().padStart(3, '0');
        const title = `${book} ${chapterNo}:${verseNo}`;
        const file = `${bookNo}_${book}_${chapterNo}_${verseNo}`;
        const howl = new Howl({
          src: [`../../media/${audioPrefix}${file}.${ext[0]}`],
          html5: true,
          preload: true,
          onplayerror: function (_, e) {
            alert(`Error playing audio ${e}`);
            controls.loadingScreen.style.display = 'none';
          },
          onloaderror: function (_, e) {
            switch (e) {
              case 1:
                alert('You aborted the audio playback.');
                break;
              case 2:
                alert(
                  `'${file}'\n either does not exist or there was a network failure`
                );
                break;
              case 3:
                alert(
                  'The audio playback was aborted due to a corruption problem or because your browser does not support it.'
                );
                break;
              case 4:
                alert(`'${file}' cannot be played.\n\nFile might not exist or is not supported.`);
                break;
              default:
                alert('An unknown error occurred.');
                break;
            }
            controls.loadingScreen.style.display = 'none';
          },
          onend: function () {
            enable('playBtn');
            self.clearHighlighted();
            self.skip('next');
          },
        });
        if (rate && rate != 1) {
          howl.rate(rate);
        }
        howl.once('load', () => {
          if (--unloadedTracks < 1) {
            controls.loadingScreen.style.display = 'none';
          }
        });
        playlist.push({ title, howl });
      }
      return playlist;
    }
    setPlaylist() {
      if (hasPause()) {
        if (!this.pausePlaylist) {
          this.pausePlaylist = this.loadPlaylist(this.sound.rate());
        }
        if (this.playlist === this.pausePlaylist) {
          return;
        }

        const currentSound = this.sound; // current sound
        const isPlaying = currentSound.playing();
        if (isPlaying) {
          currentSound.pause();
        }
        currentSound.seek(0);

        const verse = this.highlighted[this.index];
        const wordNos = Object.keys(verse);
        const wordNo = wordNos.length > 0 ? Math.max(...(wordNos.map(Number))) : 1;
        const verseCues = page.cues[this.index];
        const position = getCueStart(verseCues, wordNo, true);

        this.playlist = this.pausePlaylist;
        const newSound = this.sound; // new sound
        newSound.seek(position);
        if (isPlaying) {
          newSound.play();
        }
        return;
      }

      if (this.playlist === this.regularPlaylist) {
        return;
      }

      const currentSound = this.sound; // current sound
      const isPlaying = currentSound.playing() || this.wordTimeout > 0;
      this.clearPauseTimeout();
      if (isPlaying) {
        currentSound.pause();
      }
      currentSound.seek(0);

      const verse = this.highlighted[this.index];
      const wordNos = Object.keys(verse);
      const wordNo = wordNos.length > 0 ? Math.max(...(wordNos.map(Number))) : 1;
      const verseCues = page.cues[this.index];
      const position = getCueStart(verseCues, wordNo, true);

      this.playlist = this.regularPlaylist;
      const newSound = this.sound; // new sound
      newSound.seek(position);
      if (isPlaying) {
        newSound.play();
      }
    }
    requestHighlight() {
      // to simplify logic, we will continually poll for highlight once first interaction with audio
      if (!this.requestHighlightId) {
        this.requestHighlightId = window.setInterval(this.step.bind(this), 20);
      }
    }
    clearHighlighted() {
      let self = this;
      for (let verseNo in self.highlighted) {
        const verseHighlighted = self.highlighted[verseNo];
        for (let wordNo in verseHighlighted) {
          const words = verseHighlighted[wordNo];
          words.forEach(word => word.classList.remove('highlight'));
        }
        self.highlighted[verseNo] = {};
      }
      for (let verseNo in self.paused) {
        const versePaused = self.paused[verseNo];
        for (let wordNo in versePaused) {
          versePaused[wordNo] = false;
        }
        self.highlighted[verseNo] = {};
      }
      self.clearPauseTimeout()
    }
    clearPauseTimeout() {
      if (this.wordTimeout) {
        clearTimeout(this.wordTimeout);
        this.wordTimeout = 0;
      }
    }
    findClosestIndex(seek) {
      const cues = page.cues[this.index];
      let i = 0;
      for (; i < cues.length; i++) {
        let val = getCueStart(cues, i);
        let diff = seek - val;
        if (diff < 0) {
          break;
        }
      }
      return i - 1;
    }
  }

  const page = event.detail;
  const passiveSupported = page.passiveSupported; // let getPassiveSupported detect if true

  // Cache references to DOM elements.
  const controls = {};
  const elemIds = ['playBtn', 'pauseBtn', 'volumeBtn', 'loading', 'volume', 'barEmpty', 'barFull', 'sliderBtn', 'startVerse', 'endVerse', 'loop', 'speed', 'loadingScreen', 'wordPause'];
  for (let i = 0; i < elemIds.length; i++) {
    const elemId = elemIds[i];
    if (!(controls[elemId] = document.getElementById(elemId))) {
      console.error(`Could not find page element with id ${elemId}`);
      return;
    }
  }

  const toggleVolume = () => {
    let display = (controls.volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(() => {
      controls.volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    controls.volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  }

  const enable = (button) => {
    controls.loading.style.display = button === 'loading' ? 'block' : 'none';
    controls.playBtn.style.display = button === 'playBtn' ? 'block' : 'none';
    controls.pauseBtn.style.display = button === 'pauseBtn' ? 'block' : 'none';
  }

  const getCueStart = (verseCues, wordId, adjust) => {
    const seek = verseCues[wordId].s + (hasPause() ? (wordId > 0 ? (wordId - 1) : 0) : 0); // add wordId - 1 seconds if pause
    return seek + (adjust ? 0.01 : 0);
  }

  const getCueEnd = (verseCues, wordId) =>
    verseCues[wordId].e + (hasPause() ? (wordId > 0 ? (wordId - 1) : 0) : 0); // add wordId - 1 seconds if pause

  const hasPause = () =>
    parseInt(controls.wordPause.value) > 0;

  const usePauseTimer = () =>
    parseInt(controls.wordPause.value) > 1;

  const getPauseTime = () => {
    const val = parseInt(controls.wordPause.value);
    return val > 1 ? (val - 1) * 1000 : 0;
  }

  const getVerseWord = (id) => {
    let split;
    return id && (split = id.split('-')).length > 1 ? split : [null, null];
  }

  let sliderDown = false;

  const move = (event) => {
    if (sliderDown) {
      let x = event.clientX || event.touches[0].clientX;
      let startX = window.innerWidth * 0.05;
      let layerX = x - startX;
      let per = Math.min(1, Math.max(0, layerX / parseFloat(controls.barEmpty.scrollWidth)));
      player.volume(per);
    }
  };

  // Bind our player controls.
  controls.playBtn.addEventListener('click', () => {
    player.clearPauseTimeout();
    player.play();
  }, (passiveSupported ? { passive: true } : false));

  controls.pauseBtn.addEventListener('click', () => {
    player.clearPauseTimeout();
    player.pause();
  }, (passiveSupported ? { passive: true } : false));

  controls.wordPause.addEventListener('change', () => {
    player.setPlaylist();
  }, (passiveSupported ? { passive: true } : false));

  controls.volumeBtn.addEventListener('click', () => {
    toggleVolume();
  }, (passiveSupported ? { passive: true } : false));

  controls.volume.addEventListener('click', () => {
    toggleVolume();
  }, (passiveSupported ? { passive: true } : false));

  // Setup the event listeners to enable dragging of volume slider.
  controls.barEmpty.addEventListener('click', (event) => {
    let per = event.layerX / parseFloat(controls.barEmpty.scrollWidth);
    player.volume(per);
  }, (passiveSupported ? { passive: true } : false));

  controls.sliderBtn.addEventListener('mousedown', () => {
    liderDown = true;
  }, (passiveSupported ? { passive: true } : false));

  controls.sliderBtn.addEventListener('touchstart', () => {
    sliderDown = true;
  }, (passiveSupported ? { passive: true } : false));

  controls.volume.addEventListener('mouseup', () => {
    sliderDown = false;
  }, (passiveSupported ? { passive: true } : false));

  controls.volume.addEventListener('touchend', () => {
    sliderDown = false;
  }, (passiveSupported ? { passive: true } : false));

  controls.volume.addEventListener('mousemove', move, (passiveSupported ? { passive: true } : false));

  controls.volume.addEventListener('touchmove', move, (passiveSupported ? { passive: true } : false));

  controls.speed.addEventListener('change', (event) => {
    event.stopImmediatePropagation();
    let target = event.target;
    if (!target || !target.id || !target.id.startsWith('speed')) {
      return;
    }
    let rate = parseFloat(target.value);
    player.rate(rate);
  }, (passiveSupported ? { passive: true } : false));

  document.querySelector('main').addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    const target = event.target;
    if (!target || !target.id) { return; }

    let id = target.id.match(/(\d+-\d+)/);
    if (!id || !(id = id[0])) { return; }
    const [verseId, wordId] = getVerseWord(id);
    let verseCues, cue;
    if (!verseId || !wordId || !(verseCues = page.cues[verseId]) || !(cue = getCueStart(verseCues, wordId, true))) { return; }

    const verseNo = parseInt(verseId);
    const startNo = parseInt(controls.startVerse.value);
    const endNo = parseInt(controls.endVerse.value);
    if (verseNo < startNo) {
      controls.startVerse.value = verseId;
    }

    if (verseNo > endNo) {
      controls.endVerse.value = verseId;
    }

    player.startWord = wordId;
    player.skipTo(verseNo, cue);
  }, (passiveSupported ? { passive: true } : false));

  startVerse.addEventListener('change', (event) => {
    event.stopImmediatePropagation();
    let start = parseInt(startVerse.value);
    let end = parseInt(endVerse.value);

    if (start > end) {
      endVerse.value = startVerse.value;
      start = end = parseInt(startVerse.value);
    }

    if (!controls.loop.checked) {
      return;
    }
    const sound = player.sound;
    if (!sound) {
      return;
    }
    if (!sound.playing()) {
      return;
    }

    const current = player.index;
    if (current < start || current > end) {
      player.skipTo(start);
    }
  }, (passiveSupported ? { passive: true } : false));

  endVerse.addEventListener('change', (event) => {
    event.stopImmediatePropagation();
    let start = parseInt(startVerse.value);
    let end = parseInt(endVerse.value);

    if (start > end) {
      startVerse.value = endVerse.value;
      start = end = parseInt(startVerse.value);
    }

    if (!controls.loop.checked) {
      return;
    }
    const sound = player.sound;
    if (!sound) {
      return;
    }
    if (!sound.playing()) {
      return;
    }

    const current = player.index;
    if (current < start || current > end) {
      player.skipTo(start);
    }
  }, (passiveSupported ? { passive: true } : false));

  const player = new Player();
});
