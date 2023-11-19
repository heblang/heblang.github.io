'use strict';
if (!window.tanakh) {
  window.tanakh = {};  
}

(function () {

const passiveSupported = tanakh.getPassiveSupported(); // let getPassiveSupported detect if true

// Cache references to DOM elements.
let controls = {};
let elemIds = ['playBtn', 'pauseBtn', 'volumeBtn', 'loading', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elemIds.forEach(function(elemId) {
  controls[elemId] = document.getElementById(elemId);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
let Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;
  this.highlighted = {};
};

Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    let self = this;
    let sound;

    index = typeof index === 'number' ? index : self.index;
    let data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['../../media/01_Bereshit_' + data.file + '.m4a'],
        onplay: function() {
          // Start updating highlighted words.
          requestAnimationFrame(self.step.bind(self));

          pauseBtn.style.display = 'block';
        },
        onload: function() {
          controls.loading.style.display = 'none';
        },
        onend: function() {
          Object.entries(self.highlighted).forEach(([key, words]) => {
            words.forEach(function(word) {
              word.classList.remove('highlight');
            });
            delete self.highlighted[key]
          });
          self.skip('next');
        },
        onpause: function() {
        },
        onstop: function() {

        },
        onseek: function() {
          // Start updating the highlighted words
          requestAnimationFrame(self.step.bind(self));
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // Show the pause button.
    if (sound.state() === 'loaded') {
      controls.playBtn.style.display = 'none';
      controls.pauseBtn.style.display = 'block';
    } else {
      controls.loading.style.display = 'block';
      controls.playBtn.style.display = 'none';
      controls.pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    controls.playBtn.style.display = 'block';
    controls.pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    let self = this;

    // Get the next track based on the direction of the track.
    let index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    let self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    let self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    let barWidth = (val * 90) / 100;
    controls.barFull.style.width = (barWidth * 100) + '%';
    controls.sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    let seek = sound.seek() || 0;
    let verseCues = tanakh.chapterCues[self.verseNo()];
    for (let i = 0; i < verseCues.length; i++) {
      let cue = verseCues[i];
      if (seek < cue) { // nothing to do for rest of the higher cues
        break;
      }

      let idPrefix = self.verseNo() + '-' + self.wordNo(i);
      if (idPrefix in self.highlighted) { // word already highlighted, move to the next
        continue;
      }

      // word needs to be highlighted
      let words = self.highlighted[idPrefix] = [];
      ['w', 'i', 't'].forEach(row => { // TODO get cached from site.js
        let word = document.getElementById(idPrefix + row)
        word.classList.add('highlight')
        words.push(word);
      });
      break;
    }

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    let self = this;
    let display = (controls.volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      controls.volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    controls.volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Get current verse number
   * @return {Number}    Current verse number
   */
  verseNo: function() {
    return this.index + 1;
  },

  /**
   * Get word number for a given word index
   * @param  {Number} index Word index
   * @return {Number}    Word number
   */
  wordNo: function(index) {
    return index + 1;
  }
};

// Setup our new audio player class and pass it the playlist.
let player = new Player([
  {
    title: 'Bereshit 1:1',
    file: '001_001',
    howl: null
  }
]);

// Bind our player controls.
controls.playBtn.addEventListener('click', function() {
  player.play();
}, (passiveSupported ? { passive: true } : false));
controls.pauseBtn.addEventListener('click', function() {
  player.pause();
}, (passiveSupported ? { passive: true } : false));
controls.volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
}, (passiveSupported ? { passive: true } : false));
controls.volume.addEventListener('click', function() {
  player.toggleVolume();
}, (passiveSupported ? { passive: true } : false));

// Setup the event listeners to enable dragging of volume slider.
controls.barEmpty.addEventListener('click', function(event) {
  let per = event.layerX / parseFloat(controls.barEmpty.scrollWidth);
  player.volume(per);
}, (passiveSupported ? { passive: true } : false));
controls.sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
}, (passiveSupported ? { passive: true } : false));
controls.sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
}, (passiveSupported ? { passive: true } : false));
controls.volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
}, (passiveSupported ? { passive: true } : false));
controls.volume.addEventListener('touchend', function() {
  window.sliderDown = false;
}, (passiveSupported ? { passive: true } : false));

let move = function(event) {
  if (window.sliderDown) {
    let x = event.clientX || event.touches[0].clientX;
    let startX = window.innerWidth * 0.05;
    let layerX = x - startX;
    let per = Math.min(1, Math.max(0, layerX / parseFloat(controls.barEmpty.scrollWidth)));
    player.volume(per);
  }
};

controls.volume.addEventListener('mousemove', move, (passiveSupported ? { passive: true } : false));
controls.volume.addEventListener('touchmove', move, (passiveSupported ? { passive: true } : false));

})();
