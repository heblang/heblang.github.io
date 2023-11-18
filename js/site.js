'use strict';
if (!window.tanakh) {
  window.tanakh = {};  
}


(function () {
  
  tanakh.getPassiveSupported = function() {
    let passiveSupported = false;
    try {
      const options = {
        // This function will be called when the browser attempts to access the passive property.
        get passive() {
          passiveSupported = true;
          return false;
        }
      };
  
      window.addEventListener("test", null, options);
      window.removeEventListener("test", null, options);
    } catch (err) {
      passiveSupported = false;
    }
    return passiveSupported;
  }

  const fontFamily = document.getElementById('font-family');
  const niqqud = document.getElementById('niqqud');
  const transliterate = document.getElementById('transliterate');
  const syllables = document.getElementById('syllables');
  const stickyHeader = document.getElementById('sticky-header');
  const bookAndChapter = document.getElementById('bc');
  const passiveSupported = tanakh.getPassiveSupported(); // let getPassiveSupported detect if true

  if (!niqqud || !transliterate || !syllables || !stickyHeader || !fontFamily || !bookAndChapter) {
    console.error('Could not find required page element');
    return;
  }

  tanakh.chapterCues = [[]]; // 1 based indexes
  let verses;
  const wordElems = {};
  const interlinearElems = {};
  const translitElems = {};
  const bcCache = {};
  // Consonants + maqaf
  const consonants = "\u05d0\u05d1\u05d2\u05d3\u05d4\u05d5\u05d6\u05d7\u05d8\u05d9\u05da\u05db\u05dc\u05dd\u05de\u05df\u05e0\u05e1\u05e2\u05e3\u05e4\u05e5\u05e6\u05e7\u05e8\u05e9\u05ea\u05BE"
  // Vowels and shin/sin dots and sof pasuq
  const vowels = "\u05b0\u05b1\u05b2\u05b3\u05b4\u05b5\u05b6\u05b7\u05b8\u05b9\u05ba\u05bb\u05bc\u05c1\u05c2\u05C3"
  // Compiled Regular Expressions
  const regexConsonants = new RegExp(`[${consonants}]`, 'gu');
  const regexVowels = new RegExp(`[${consonants}${vowels}]`, 'gu');
 
  tanakh.initText = function(bookNo, chapterNo) {
    verses = tanakh.books[bookNo][chapterNo];

    bookAndChapter.innerText = getBookAndChapter(getWordKey());   
    for(let i = 1; i < verses.length; i++) {
      var cues = [];
      tanakh.chapterCues.push(cues);
      let words = verses[i];
      for (let j = 1; j < words.length; j++) {
        let wobj = words[j];
        let word = wobj.a;
        let interlinear = wobj.i;
        let id = i + '-' + j;
        cues.push(wobj.t);

        // cache DOM refs
        wordElems[id] = document.getElementById(id + 'w');
        interlinearElems[id] = document.getElementById(id + 'i');
        translitElems[id] = document.getElementById(id + 't');

        wordElems[id].innerText = word;
        interlinearElems[id].innerText = interlinear;
      }
    }
  }
  
  function toggleText(event) {
    event.stopImmediatePropagation();

    const key = getWordKey();
    const filter = key == 'v' ? getVoweled : getConsonants;

    bookAndChapter.innerText = getBookAndChapter(key);
    for(let i = 1; i < verses.length; i++) {
      let words = verses[i];
      for (let j = 1; j < words.length; j++) {
        let wobj = words[j];
        let word = wobj[key]; 
        if (!word) {
          wobj[key] = word = filter(wobj.a);
        }
        wordElems[i + '-' + j].innerText = word;
      }
    }
  }

  function toggleTranslit() {
    const key = getTranslitKey();
    for(let i = 1; i < verses.length; i++) {
      let words = verses[i];
      for (let j = 1; j < words.length; j++) {
        let wobj = words[j];
        let word = wobj[key]; 
        if (!word) {
          word = key == 'q' ? wobj.p : wobj.l;
          if (!syllables.checked) {
            word = word.replace(/·/g, '');
          }
          wobj[key] = word;
        }
        translitElems[i + '-' + j].innerText = word;
      }
    }
  }

  // Filtering Functions
  function getConsonants(text) {
    if (typeof text !== 'string') return '';
    return (text.match(regexConsonants) || []).join('');
  }

  function getVoweled(text) {
    if (typeof text !== 'string') return '';
    return (text.match(regexVowels) || []).join('');
  }

  function getBookAndChapter(key) {
    var cached = bcCache[key]
    if (cached) {
      return cached;
    }
    switch (niqqud.value) {
      case 'vowels':
        cached = getVoweled(tanakh.books[0][0]) + ' ' + getVoweled('פֶּרֶק') + ' ' + getVoweled(verses[0][0]);
        break;
      case 'consonants':
        cached = getConsonants(tanakh.books[0][0]) + ' ' + getConsonants('פֶּרֶק') + ' ' + getConsonants(verses[0][0]);
        break;
      default:
        cached = tanakh.books[0][0] + ' פֶּרֶק ' + verses[0][0];
        break;
    }
    bcCache[key] = cached
    return cached;
  }

  function getWordKey() {
    return niqqud.value == 'vowels'
    ? 'v'
    : niqqud.value == 'consonants'
      ? 'c'
      : 'a';
  }

  function getTranslitKey() {
    const sc = syllables.checked;
    return transliterate.value == 'phonetic'
    ? (sc ? 'p' : 'q')
    : transliterate.value == 'latin'
      ? (sc ? 'l' : 'm')
      : (function() { throw new Error("Invalid invocation of getTranslitKey"); })();
  }
  
  fontFamily.addEventListener('change', function (event) {
    event.stopImmediatePropagation();
    let newFont = fontFamily.value;
    let options = fontFamily.options;
    for (let i = 0; i < options.length; i++) {
      let oldFont = options[i].value;
      if (oldFont == newFont) {
        continue;
      }
      document.querySelectorAll(`.${oldFont}`).forEach(
        element => element.classList.replace(oldFont, newFont)
      );
    }
  }, (passiveSupported ? { passive: true } : false));

  niqqud.addEventListener('change', toggleText, (passiveSupported ? { passive: true } : false));

  transliterate.addEventListener('change', function (event) {
    event.stopImmediatePropagation();
    if (transliterate.value == 'phonetic' || transliterate.value == 'latin') {
      toggleTranslit();
      syllables.disabled = false;
      document.querySelectorAll('.tran').forEach(
        tran => tran.classList.remove('hide'));
    }
    else {
      syllables.disabled = true;
      document.querySelectorAll('.tran').forEach(
        tran => tran.classList.add('hide'));
    }
  }, (passiveSupported ? { passive: true } : false));

  syllables.addEventListener('click', function (event) {
    event.stopImmediatePropagation();
    toggleTranslit();
  }, (passiveSupported ? { passive: true } : false));

  stickyHeader.addEventListener('click', function (event) {
    event.stopImmediatePropagation();
    if (stickyHeader.checked) {
      document.getElementsByTagName('header')[0].classList.add('sticky');
    } else {
      document.getElementsByTagName('header')[0].classList.remove('sticky');
    }
  }, (passiveSupported ? { passive: true } : false));
})();
