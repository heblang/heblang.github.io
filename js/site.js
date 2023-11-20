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

  const controls = {};
  const elemIds = ['fontFamily', 'niqqud', 'transliterate', 'syllables', 'stickyHeader', 'bookAndChapter'];
  elemIds.forEach(function(elemId) {
    controls[elemId] = document.getElementById(elemId);
  });

  const passiveSupported = tanakh.getPassiveSupported(); // let getPassiveSupported detect if true

  if (!controls.niqqud || !controls.transliterate || !controls.syllables || !controls.stickyHeader || !controls.fontFamily || !controls.bookAndChapter) {
    console.error('Could not find required page element');
    return;
  }

  tanakh.chapterCues = [[]]; // 1 based indexes
  tanakh.elements = {
    word: {},
    inter: {},
    translit: {}
  };
  let verses;
  const bcCache = {};
  // Consonants + maqaf
  const consonants = "\u05d0\u05d1\u05d2\u05d3\u05d4\u05d5\u05d6\u05d7\u05d8\u05d9\u05da\u05db\u05dc\u05dd\u05de\u05df\u05e0\u05e1\u05e2\u05e3\u05e4\u05e5\u05e6\u05e7\u05e8\u05e9\u05ea\u05BE"
  // Vowels and shin/sin dots and sof pasuq
  const vowels = "\u05b0\u05b1\u05b2\u05b3\u05b4\u05b5\u05b6\u05b7\u05b8\u05b9\u05ba\u05bb\u05bc\u05c1\u05c2\u05C3"
  // Compiled Regular Expressions
  const regexConsonants = new RegExp(`[${consonants}]`, 'gu');
  const regexVowels = new RegExp(`[${consonants}${vowels}]`, 'gu');
 
  tanakh.init = function(bookNo, chapterNo) {
    verses = tanakh.books[bookNo][chapterNo];
    tanakh.current = {
      book: {
        a: tanakh.books[0][0],
        p: tanakh.books[0][1],
        n: bookNo
      },
      chapter: {
        a: verses[0][0],
        n: chapterNo
      }
    };

    controls.bookAndChapter.innerText = getBookAndChapter(getWordKey());   
    for(let i = 1; i < verses.length; i++) {
      var cues = [0];
      tanakh.chapterCues.push(cues);
      let words = verses[i];
      for (let j = 1; j < words.length; j++) {
        let wobj = words[j];
        let word = wobj.a;
        let interlinear = wobj.i;
        let id = i + '-' + j;
        cues.push(wobj.t);

        // cache DOM refs
        tanakh.elements.word[id] = document.getElementById(id + 'w');
        tanakh.elements.inter[id] = document.getElementById(id + 'i');
        tanakh.elements.translit[id] = document.getElementById(id + 't');

        tanakh.elements.word[id].innerText = getConsonants(word);
        tanakh.elements.inter[id].innerText = interlinear;
      }
    }

    tanakh.initPlayer();
  }
  
  function toggleText(event) {
    event.stopImmediatePropagation();

    const key = getWordKey();
    const filter = key == 'v' ? getVoweled : getConsonants;

    controls.bookAndChapter.innerText = getBookAndChapter(key);
    for(let i = 1; i < verses.length; i++) {
      let words = verses[i];
      for (let j = 1; j < words.length; j++) {
        let wobj = words[j];
        let word = wobj[key]; 
        if (!word) {
          wobj[key] = word = filter(wobj.a);
        }
        tanakh.elements.word[i + '-' + j].innerText = word;
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
          if (!controls.syllables.checked) {
            word = word.replace(/·/g, '');
          }
          wobj[key] = word;
        }
        tanakh.elements.translit[i + '-' + j].innerText = word;
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
    let cached = bcCache[key]
    if (cached) {
      return cached;
    }

    const pereq = 'פֶּרֶק';
    switch (controls.niqqud.value) {
      case 'vowels':
        cached = `${getVoweled(tanakh.current.book.a)} ${getVoweled(pereq)} ${tanakh.current.chapter.a}`;
        break;
      case 'consonants':
        cached = `${getConsonants(tanakh.current.book.a)} ${getConsonants(pereq)} ${tanakh.current.chapter.a}`;
        break;
      default:
        cached = `${tanakh.current.book.a} ${pereq} ${tanakh.current.chapter.a}`;
        break;
    }
    bcCache[key] = cached
    return cached;
  }

  function getWordKey() {
    return controls.niqqud.value == 'vowels'
    ? 'v'
    : controls.niqqud.value == 'consonants'
      ? 'c'
      : 'a';
  }

  function getTranslitKey() {
    const sc = controls.syllables.checked;
    return controls.transliterate.value == 'phonetic'
    ? (sc ? 'p' : 'q')
    : controls.transliterate.value == 'latin'
      ? (sc ? 'l' : 'm')
      : (function() { throw new Error("Invalid invocation of getTranslitKey"); })();
  }
  
  controls.fontFamily.addEventListener('change', function (event) {
    event.stopImmediatePropagation();
    let newFont = controls.fontFamily.value;
    let options = controls.fontFamily.options;
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

  controls.niqqud.addEventListener('change', toggleText, (passiveSupported ? { passive: true } : false));

  controls.transliterate.addEventListener('change', function (event) {
    event.stopImmediatePropagation();
    if (controls.transliterate.value == 'phonetic' || controls.transliterate.value == 'latin') {
      toggleTranslit();
      controls.syllables.disabled = false;
      document.querySelectorAll('.tran').forEach(
        tran => tran.classList.remove('hide'));
    }
    else {
      controls.syllables.disabled = true;
      document.querySelectorAll('.tran').forEach(
        tran => tran.classList.add('hide'));
    }
  }, (passiveSupported ? { passive: true } : false));

  controls.syllables.addEventListener('click', function (event) {
    event.stopImmediatePropagation();
    toggleTranslit();
  }, (passiveSupported ? { passive: true } : false));

  controls.stickyHeader.addEventListener('click', function (event) {
    event.stopImmediatePropagation();
    if (controls.stickyHeader.checked) {
      document.getElementsByTagName('header')[0].classList.add('sticky');
    } else {
      document.getElementsByTagName('header')[0].classList.remove('sticky');
    }
  }, (passiveSupported ? { passive: true } : false));
})();
