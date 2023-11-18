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
  
  tanakh.initText = function(bookNo, chapterNo) {
    verses = tanakh.books[bookNo][chapterNo];
    bookAndChapter.innerText = tanakh.books[0] + ' ' + verses[0];
    populateText();
    console.log(tanakh.chapterCues);
  }

  function populateText() {
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

        if (!wordElems[id]) wordElems[id] = document.getElementById(id + 'w');
        if (!interlinearElems[id]) interlinearElems[id] = document.getElementById(id + 'i');
        if (!translitElems[id]) translitElems[id] = document.getElementById(id + 't');
        wordElems[id].innerText = word;
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

    let reveal = '';
    switch (niqqud.value) {
      case 'vowels':
        reveal = '.hide[id$=v]';
        break;
      case 'cantillation':
        reveal = '.hide[id$=a]';
        break;
      default:
        reveal = '.hide[id$=c]';
        break;
    }

    const shows = document.querySelectorAll('.show');
    const hides = document.querySelectorAll(reveal);
    shows.forEach(elem => elem.classList.replace('show', 'hide'));
    hides.forEach(elem => elem.classList.replace('hide', 'show'));
  }
  niqqud.addEventListener('change', toggleText, (passiveSupported ? { passive: true } : false));

  transliterate.addEventListener('change', function (event) {
    event.stopImmediatePropagation();
    if (transliterate.value == 'academic' || transliterate.value == 'general') {
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
