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
  // Consonants ONLY
  const consonants = "\u05d0\u05d1\u05d2\u05d3\u05d4\u05d5\u05d6\u05d7\u05d8\u05d9\u05da\u05db\u05dc\u05dd\u05de\u05df\u05e0\u05e1\u05e2\u05e3\u05e4\u05e5\u05e6\u05e7\u05e8\u05e9\u05ea"
  // Vowels and shin/sin dots and sof pasuq
  const vowels = "\u05b0\u05b1\u05b2\u05b3\u05b4\u05b5\u05b6\u05b7\u05b8\u05b9\u05ba\u05bb\u05bc\u05c1\u05c2\u05C3"
  // Accents plus ZWJ and CGJ but without maqaf or sof pasuq or blank
  const accents ="\u0591\u0592\u0593\u0594\u0595\u0596\u0597\u0598\u0599\u059a\u059b\u059c\u059d\u059e\u059f\u05a0\u05a1\u05a2\u05a3\u05a4\u05a5\u05a6\u05a7\u05a8\u05a9\u05aa\u05ab\u05ac\u05ad\u05ae\u05bd\u05bf\u05c0\u05c4\u05c5\u200d\u034f"
  // Compiled Regular Expressions
  const regexConsonants = new RegExp(`[${consonants}]`, 'gu');
  const regexVowels = new RegExp(`[${consonants}${vowels}]`, 'gu');
  const regexAccents = new RegExp(`[${consonants}${vowels}${accents}]`, 'gu');
  // Filtering Functions
  function getConsonants(text) {
    if (typeof text !== 'string') return '';
    return (text.match(regexConsonants) || []).join('');
  }

  function getVoweled(text) {
    if (typeof text !== 'string') return '';
    return (text.match(regexVowels) || []).join('');
  }

  function getAccented(text) {
    if (typeof text !== 'string') return '';
    return (text.match(regexAccents) || []).join('');
  }

  function getBookAndChapter(filter) {
    return filter(tanakh.books[0][0]) + ' ' + filter('פֶּרֶק') + ' ' + filter(verses[0][0]);
  }

  function getWordFilter() {
    return niqqud.value == 'vowels'
      ? getVoweled
      : niqqud.value == 'accents'
        ? getAccented
        : getConsonants;
  }
  
  tanakh.initText = function(bookNo, chapterNo) {
    verses = tanakh.books[bookNo][chapterNo];

    bookAndChapter.innerText = getBookAndChapter(getWordFilter());   
    for(let i = 1; i < verses.length; i++) {
      var cues = [];
      tanakh.chapterCues.push(cues);
      let words = verses[i];
      for (let j = 1; j < words.length; j++) {
        let wobj = words[j];
        let word = wobj.w;
        let interlinear = wobj.i;
        let phonetic = wobj.p;
        let id = i + '-' + j;
        cues.push(wobj.c);

        wordElems[id] = document.getElementById(id + 'w');
        interlinearElems[id] = document.getElementById(id + 'i');
        translitElems[id] = document.getElementById(id + 't');
        wordElems[id].innerText = getConsonants(word);
        interlinearElems[id].innerText = interlinear;
        translitElems[id].innerText = phonetic;
      }
    }
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

  function toggleText(event) {
    event.stopImmediatePropagation();

    let filter = getWordFilter();
    bookAndChapter.innerText = getBookAndChapter(filter);   
    for(let i = 1; i < verses.length; i++) {
      let words = verses[i];
      for (let j = 1; j < words.length; j++) {
        let word = words[j].w;
        let id = i + '-' + j;
        wordElems[id].innerText = filter(word);
      }
    }
  }

  niqqud.addEventListener('change', toggleText, (passiveSupported ? { passive: true } : false));

  transliterate.addEventListener('change', function (event) {
    event.stopImmediatePropagation();
    if (transliterate.value == 'phonetic' || transliterate.value == 'latin') {
      syllables.disabled = false;
      let reveal = transliterate.value == 'academic' ? '.ntran[id$=t]' : '.ntran[id$=g]';
      let hide = transliterate.value == 'academic' ? '.tran[id$=g]' : '.tran[id$=t]';
      document.querySelectorAll(hide).forEach(
        ntran => ntran.classList.replace('tran', 'ntran'));
      document.querySelectorAll(reveal).forEach(
        ntran => ntran.classList.replace('ntran', 'tran'));
    }
    else {
      syllables.disabled = true;
      document.querySelectorAll('.tran').forEach(
        tran => tran.classList.replace('tran', 'ntran'));
    }
  }, (passiveSupported ? { passive: true } : false));

  syllables.addEventListener('click', function (event) {
    event.stopImmediatePropagation();
    if (syllables.checked) {
      document.querySelectorAll('span.h').forEach(
        h => h.classList.replace('h', 's'));
      return;
    }
    document.querySelectorAll('span.s').forEach(
      s => s.classList.replace('s', 'h'));
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
