'use strict';
var tanakh = tanakh || {};

(function () {
  var verses;
  tanakh.initText = function(bookNo, chapterNo) {
    verses = tanakh.books[bookNo][chapterNo];
    populateText();
  }
  
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
  const passiveSupported = tanakh.getPassiveSupported(); // let getPassiveSupported detect if true

  if (!niqqud || !transliterate || !syllables || !stickyHeader || !fontFamily) {
    console.error('Could not find required page element');
    return;
  }

  var wordElems = {};
  var interlinearElems = {};
  var translitElems = {};

  function populateText() {
    for(var i = 1; i < verses.length; i++) {
      var words = verses[i];
      for (var j = 1; j < words.length; j++) {
        var wobj = words[j];
        var word = wobj.w;
        var cue = wobj.c;
        var interlinear = wobj.i;
        var phonetic = wobj.p;
        var latin = wobj.l;
        var id = i + '-' + j;

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
    var options = fontFamily.options;
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
