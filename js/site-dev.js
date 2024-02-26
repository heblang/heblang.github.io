'use strict';
window.tanakh || (window.tanakh = {});

(() => {
  const page = {};

  page.isMobileEdge = navigator.userAgent.includes('Edg') && (
    navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone'));

  // let getPassiveSupported detect if true
  const passiveSupported = page.passiveSupported = (() => {
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
  })();

  const controls = {};
  const elemIds = ['fontFamily', 'niqqud', 'transliterate', 'syllables', 'stickyHeader', 'currentBook'];
  for (let i = 0; i < elemIds.length; i++) {
    const elemId = elemIds[i];
    if (!(controls[elemId] = document.getElementById(elemId))) {
      alert(`Could not find page element with id ${elemId}`);
      return;
    }
  }

  tanakh.init = (bookNo, chapterNo) => {
    page.info = {
      book: {
        a: tanakh.names.w[bookNo],
        p: tanakh.names.p[bookNo],
        m: tanakh.names.m[bookNo],
        n: bookNo
      },
      chapter: {
        a: tanakh.numbers[chapterNo],
        n: chapterNo
      }
    };

    // For size considerations, tanakh.books references are all zero based
    bookCache._a = controls.currentBook.innerText
    verses = tanakh.books[dec(bookNo)][dec(chapterNo)];
    for (let i = 1; i < verses.length + 1; i++) {
      var cues = [0];
      page.cues.push(cues);
      let words = verses[dec(i)];
      for (let j = 1; j < words.length + 1; j++) {
        let wobj = words[dec(j)];
        let id = i + '-' + j;
        wobj.t && cues.push(wobj.t);

        // cache DOM refs
        page.elements.word[id] = document.getElementById(id + 'w');
        page.elements.inter[id] = document.getElementById(id + 'i');
        page.elements.translit[id] = document.getElementById(id + 't');

        wobj._a = page.elements.word[id].cloneNode(true);
        wobj._p = page.elements.translit[id].innerText;
      }
    }

    let maxWidth = 0;
    const noElems = document.querySelectorAll('.no');
    for (let i = 0; i < noElems.length; i++) {
      const width = noElems[i].getBoundingClientRect().width;
      if (width > maxWidth) {
        maxWidth = width;
      }
    }
    for (let i = 0; i < noElems.length; i++) {
      noElems[i].style.width = maxWidth + 'px';
    }

    restoreOptions();

    let event = new CustomEvent('pageCompleted', { detail: page });
    document.dispatchEvent(event);
  }

  const dec = x => x - 1;

  function restoreOptions() {
    if (!isLocalAvail) {
      return;
    }

    const storedFontFamily = localStorage.getItem(localKey.fontFamily);
    if (storedFontFamily != null && controls.fontFamily.value != storedFontFamily) {
      controls.fontFamily.value = storedFontFamily;
      toggleFontFamily();
    }

    const storedNiqqud = localStorage.getItem(localKey.niqqud);
    if (storedNiqqud != null && controls.niqqud.value != storedNiqqud) {
      controls.niqqud.value = storedNiqqud;
      toggleText();
    }
  }

  function traverseAndReplace(node, replacementFunction) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Node is a text node, replace its content
      node.nodeValue = replacementFunction(node.nodeValue);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Node is an element node, traverse its children
      node.childNodes.forEach(child => traverseAndReplace(child, replacementFunction));
    }
  }

  const isLocalAvail = (() => {
    const testKey = 'testStorage';
    try {
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  })();

  const isSessionAvail = (() => {
    const testKey = 'testSession';
    try {
      sessionStorage.setItem(testKey, '1');
      sessionStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  })();

  page.cues = [[]]; // 1 based indexes
  page.elements = {
    word: {},
    inter: {},
    translit: {}
  };
  let verses;
  const bookCache = {};
  // Consonants only
  const consonants = tanakh.consonants.join('');
  // Vowels and meteg and shin/sin dots
  const vowels = tanakh.vowels.join('');
  // Compiled Regular Expressions
  const regexConsonants = new RegExp(`[${consonants}]`, 'gu');
  const regexVowels = new RegExp(`[${consonants}${vowels}]`, 'gu');

  const localKey = {
    fontFamily: 'fontFamily',
    niqqud: 'niqqud',
    translit: 'translit',
    syllables: 'syllables'
  };

  const sessionKey = {
    chapterStart: 'chapterStart',
    chapterEnd: 'chapterEnd',
    speed: 'speed',
    pause: 'pause'
  };

  // Filtering Functions
  function getConsonant(text) {
    if (typeof text !== 'string') return '';
    return (text.match(regexConsonants) || []).join('');
  }

  function getVoweled(text) {
    if (typeof text !== 'string') return '';
    return (text.match(regexVowels) || []).join('');
  }

  function getcurrentBook(key) {
    let cached = bookCache[key]
    if (cached) {
      return cached;
    }

    const pereq = 'פֶּרֶק';
    switch (controls.niqqud.value) {
      case 'vowels':
        cached = `${getVoweled(page.info.book.a)} ${getVoweled(pereq)}`;
        break;
      case 'consonants':
        cached = `${getConsonant(page.info.book.a)} ${getConsonant(pereq)}`;
        break;
      case 'male':
        cached = `${page.info.book.m} ${getConsonant(pereq)}`;
        break;
      default:
        cached = '';
        break;
    }
    bookCache[key] = cached
    return cached;
  }

  function getWordKey() {
    return controls.niqqud.value == 'vowels'
      ? '_v'
      : controls.niqqud.value == 'consonants'
        ? '_c'
        : controls.niqqud.value == 'male'
          ? '_m'
          : '_a';
  }

  function getTranslitKey() {
    const sc = controls.syllables.checked;
    return controls.transliterate.value == 'phonetic'
      ? (sc ? '_p' : '__p')
      : controls.transliterate.value == 'latin'
        ? (sc ? '_l' : '__l')
        : (() => { throw new Error("Invalid invocation of getTranslitKey"); })();
  }

  function getMale(wobj) {
    const m = wobj.m;
    const amale = tanakh.male[m];
    let male = [];
    for (const c of amale) {
      male.push(tanakh.calheb[c]);
    }
    return male.join('');
  }

  function getTranslit(wobj) {
    const l = wobj.l;
    const atranslit = tanakh.translit[l];
    let translit = [];
    for (const c of atranslit) {
      translit.push(tanakh.caltranslit[c]);
    }
    return translit.join('');
  }

  function toggleText() {
    if (controls.niqqud.value == 'accents') {
      document.querySelectorAll('.paseq').forEach(
        p => p.classList.remove('hide'));
    }
    else {
      document.querySelectorAll('.paseq').forEach(
        p => p.classList.add('hide'));
    }

    if (controls.niqqud.value == 'consonants' || controls.niqqud.value == 'male') {
      document.querySelectorAll('.sof-pasuq').forEach(
        p => p.classList.add('hide'));
    }
    else {
      document.querySelectorAll('.sof-pasuq').forEach(
        p => p.classList.remove('hide'));
    }

    const key = getWordKey();
    controls.currentBook.innerText = getcurrentBook(key);

    const filter = key == '_v'
      ? getVoweled
      : key == '_c'
        ? getConsonant
        : x => x;

    for (let i = 1; i < verses.length + 1; i++) {
      let words = verses[dec(i)];
      for (let j = 1; j < words.length + 1; j++) {
        let wobj = words[dec(j)];
        let node = wobj[key];
        if (!node) {
          if (key == '_m') {
            node = getMale(wobj)
          }
          else {
            node = wobj._a.cloneNode(true);
            traverseAndReplace(node, filter);
          }
          wobj[key] = node;
        }
        page.elements.word[i + '-' + j].innerHTML = key == '_m' ? node : node.innerHTML;
      }
    }
  }

  function toggleTranslit() {
    const key = getTranslitKey();
    for (let i = 1; i < verses.length + 1; i++) {
      let words = verses[dec(i)];
      for (let j = 1; j < words.length + 1; j++) {
        let wobj = words[(dec(j))];
        let word = wobj[key];
        if (!word) {
          word = key == '_l' || key == '__l' ? getTranslit(wobj) : wobj._p;
          if (!controls.syllables.checked) {
            word = word.replace(/·/g, '');
          }
          wobj[key] = word;
        }
        let elem = page.elements.translit[i + '-' + j];
        elem.innerText = word;
      }
    }
    if (isLocalAvail) {
      window.localStorage.setItem(localKey.fontFamily, newFont);
    }
  }

  function toggleFontFamily() {
    let newFont = controls.fontFamily.value;
    let options = controls.fontFamily.options;
    for (let i = 0; i < options.length; i++) {
      let oldFont = options[i].value;
      if (oldFont == newFont || !page.elements.word['1-1'].parentElement.classList.contains(oldFont)) {
        continue;
      }
      document.querySelectorAll(`.${oldFont}`).forEach(
        element => element.classList.replace(oldFont, newFont)
      );
    }
  }

  controls.fontFamily.addEventListener('change', (event) => {
    event.stopImmediatePropagation();
    toggleFontFamily();
    if (isLocalAvail) {
      window.localStorage.setItem(localKey.fontFamily, controls.fontFamily.value);
    }
  }, (passiveSupported ? { passive: true } : false));

  controls.niqqud.addEventListener('change', event => {
    event.stopImmediatePropagation();
    toggleText();
    if (isLocalAvail) {
      window.localStorage.setItem(localKey.niqqud, controls.niqqud.value);
    }
  }, (passiveSupported ? { passive: true } : false));

  controls.transliterate.addEventListener('change', (event) => {
    event.stopImmediatePropagation();
    if (controls.transliterate.value == 'phonetic' || controls.transliterate.value == 'latin') {
      controls.syllables.disabled = false;
      toggleTranslit();
      document.querySelectorAll('.tran').forEach(
        tran => tran.classList.remove('hide'));
    }
    else {
      controls.syllables.disabled = true;
      document.querySelectorAll('.tran').forEach(
        tran => tran.classList.add('hide'));
    }
  }, (passiveSupported ? { passive: true } : false));

  controls.syllables.addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    toggleTranslit();
  }, (passiveSupported ? { passive: true } : false));

  controls.stickyHeader.addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    if (controls.stickyHeader.checked) {
      document.getElementsByTagName('header')[0].classList.add('sticky');
    } else {
      document.getElementsByTagName('header')[0].classList.remove('sticky');
    }
  }, (passiveSupported ? { passive: true } : false));
})();
