(function () {
  "use strict";

  var STORAGE = {
    theme: "bible-reader-theme",
    tamil: "bible-reader-show-tamil",
    sinhala: "bible-reader-show-sinhala",
    rate: "bible-reader-rate",
    book: "bible-reader-book",
    chapter: "bible-reader-chapter"
  };

  var state = {
    books: [],
    book: null,
    en: null,
    ta: null,
    sn: null
  };

  var els = {};
  var reader = null;

  function $(id) {
    return document.getElementById(id);
  }

  function bookUrl(book, suffix) {
    return "json/" + encodeURIComponent(book) + "_" + suffix + ".json";
  }

  function readStore(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function applyTheme(theme) {
    var allowed = { light: 1, dark: 1, "high-contrast": 1 };
    if (!allowed[theme]) theme = "light";
    document.documentElement.setAttribute("data-theme", theme);
    els.themeSelect.value = theme;
    writeStore(STORAGE.theme, theme);
  }

  function applyLangVisibility() {
    var showTa = els.toggleTamil.checked;
    var showSn = els.toggleSinhala.checked;
    els.content.classList.toggle("hide-ta", !showTa);
    els.content.classList.toggle("hide-sn", !showSn);
    writeStore(STORAGE.tamil, showTa ? "1" : "0");
    writeStore(STORAGE.sinhala, showSn ? "1" : "0");
    updateColHeaders();
  }

  function updateColHeaders() {
    var headers = els.content.querySelector(".col-headers");
    if (!headers) return;
    var showTa = !els.content.classList.contains("hide-ta");
    var showSn = !els.content.classList.contains("hide-sn");
    headers.innerHTML =
      '<span class="h-num" aria-hidden="true"></span>' +
      "<span>English · NKJV</span>" +
      (showTa ? "<span>Tamil</span>" : "") +
      (showSn ? "<span>Sinhala</span>" : "");
  }

  function fillBookSelect(books) {
    var matthewIndex = books.indexOf("Matthew");
    if (matthewIndex < 0) matthewIndex = books.length;

    var ot = document.createElement("optgroup");
    ot.label = "Old Testament";
    var nt = document.createElement("optgroup");
    nt.label = "New Testament";

    books.forEach(function (name, i) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (i < matthewIndex) ot.appendChild(opt);
      else nt.appendChild(opt);
    });

    els.bookSelect.innerHTML = "";
    els.bookSelect.appendChild(ot);
    els.bookSelect.appendChild(nt);
  }

  function fillChapterSelect(enData, preferred) {
    var keys = Object.keys(enData || {}).sort(function (a, b) {
      return Number(a) - Number(b);
    });
    els.chapterSelect.innerHTML = "";
    keys.forEach(function (k) {
      var opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      els.chapterSelect.appendChild(opt);
    });
    if (preferred && keys.indexOf(String(preferred)) !== -1) {
      els.chapterSelect.value = String(preferred);
    } else if (keys.length) {
      els.chapterSelect.value = keys[0];
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cellText(arr, index) {
    if (!arr || !arr[index]) return "";
    return arr[index].verse_text || "";
  }

  function renderChapter(chapterKey) {
    var enVerses = (state.en && state.en[chapterKey]) || [];
    if (!enVerses.length) {
      els.content.innerHTML = '<p class="empty-state">No verses found.</p>';
      if (reader) reader.resetToStart();
      return;
    }

    var taVerses = (state.ta && state.ta[chapterKey]) || [];
    var snVerses = (state.sn && state.sn[chapterKey]) || [];

    var html =
      '<h1 class="chapter-heading">' +
      escapeHtml(state.book) +
      " " +
      escapeHtml(chapterKey) +
      "</h1>" +
      '<div class="verse-grid">' +
      '<div class="col-headers" aria-hidden="true"></div>';

    for (var i = 0; i < enVerses.length; i++) {
      var num = enVerses[i].verse != null ? enVerses[i].verse : i + 1;
      html +=
        '<article class="verse-row" data-verse-index="' +
        i +
        '">' +
        '<span class="verse-num">' +
        escapeHtml(String(num)) +
        "</span>" +
        '<div class="lang-en"><span class="lang-label">English</span><p class="verse-text">' +
        escapeHtml(cellText(enVerses, i)) +
        "</p></div>" +
        '<div class="lang-ta"><span class="lang-label">Tamil</span><p class="verse-text">' +
        escapeHtml(cellText(taVerses, i)) +
        "</p></div>" +
        '<div class="lang-sn"><span class="lang-label">Sinhala</span><p class="verse-text">' +
        escapeHtml(cellText(snVerses, i)) +
        "</p></div>" +
        "</article>";
    }

    html += "</div>";
    els.content.innerHTML = html;
    applyLangVisibility();
    updateColHeaders();

    if (reader) reader.resetToStart();
  }

  function showError(message) {
    els.content.innerHTML =
      '<p class="error-state">' + escapeHtml(message) + "</p>";
  }

  function loadBook(book, preferredChapter) {
    state.book = book;
    writeStore(STORAGE.book, book);
    els.content.innerHTML = '<p class="empty-state">Loading…</p>';

    return Promise.all([
      fetch(bookUrl(book, "en_nkjv")).then(function (r) {
        if (!r.ok) throw new Error("en");
        return r.json();
      }),
      fetch(bookUrl(book, "ta_tav")).then(function (r) {
        if (!r.ok) throw new Error("ta");
        return r.json();
      }),
      fetch(bookUrl(book, "sn_snv")).then(function (r) {
        if (!r.ok) throw new Error("sn");
        return r.json();
      })
    ])
      .then(function (results) {
        state.en = results[0];
        state.ta = results[1];
        state.sn = results[2];
        fillChapterSelect(state.en, preferredChapter);
        var chapter = els.chapterSelect.value;
        writeStore(STORAGE.chapter, chapter);
        renderChapter(chapter);
      })
      .catch(function () {
        showError("Couldn’t load this book. Try again.");
      });
  }

  function initReader() {
    if (reader) reader.destroy();
    reader = new window.BibleReader({
      getVerseElements: function () {
        return els.content.querySelectorAll(".verse-row");
      },
      getEnglishText: function (el) {
        var node = el.querySelector(".lang-en .verse-text");
        return node ? node.textContent : "";
      },
      btnPlay: els.btnPlay,
      btnPrev: els.btnPrev,
      btnNext: els.btnNext,
      rateSelect: els.rateSelect,
      statusEl: els.readerStatus
    });
  }

  function bindEvents() {
    els.bookSelect.addEventListener("change", function () {
      if (reader) reader.pause();
      loadBook(els.bookSelect.value, "1");
    });

    els.chapterSelect.addEventListener("change", function () {
      if (reader) reader.pause();
      writeStore(STORAGE.chapter, els.chapterSelect.value);
      renderChapter(els.chapterSelect.value);
    });

    els.toggleTamil.addEventListener("change", applyLangVisibility);
    els.toggleSinhala.addEventListener("change", applyLangVisibility);

    els.themeSelect.addEventListener("change", function () {
      applyTheme(els.themeSelect.value);
    });

    els.rateSelect.addEventListener("change", function () {
      writeStore(STORAGE.rate, els.rateSelect.value);
    });
  }

  function restorePrefs() {
    applyTheme(readStore(STORAGE.theme, "light"));

    var ta = readStore(STORAGE.tamil, "1");
    var sn = readStore(STORAGE.sinhala, "1");
    els.toggleTamil.checked = ta !== "0" && ta !== "false";
    els.toggleSinhala.checked = sn !== "0" && sn !== "false";

    var rate = readStore(STORAGE.rate, "1");
    if (["0.75", "1", "1.25", "1.5"].indexOf(rate) !== -1) {
      els.rateSelect.value = rate;
    }
  }

  function init() {
    els = {
      bookSelect: $("book-select"),
      chapterSelect: $("chapter-select"),
      toggleTamil: $("toggle-tamil"),
      toggleSinhala: $("toggle-sinhala"),
      themeSelect: $("theme-select"),
      btnPrev: $("btn-prev"),
      btnPlay: $("btn-play"),
      btnNext: $("btn-next"),
      rateSelect: $("rate-select"),
      readerStatus: $("reader-status"),
      content: $("content")
    };

    restorePrefs();
    bindEvents();
    initReader();
    applyLangVisibility();

    fetch("json/books.json")
      .then(function (r) {
        if (!r.ok) throw new Error("books");
        return r.json();
      })
      .then(function (books) {
        state.books = books;
        fillBookSelect(books);
        var savedBook = readStore(STORAGE.book, "Genesis");
        if (books.indexOf(savedBook) === -1) savedBook = books[0] || "Genesis";
        els.bookSelect.value = savedBook;
        var savedChapter = readStore(STORAGE.chapter, "1");
        return loadBook(savedBook, savedChapter);
      })
      .catch(function () {
        showError("Couldn’t load this book. Try again.");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
