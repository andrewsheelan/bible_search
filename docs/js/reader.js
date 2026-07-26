(function (global) {
  "use strict";

  /**
   * English-only chapter speech reader with verse highlight.
   * @param {{
   *   getVerseElements: () => NodeListOf<HTMLElement>|HTMLElement[],
   *   getEnglishText: (el: HTMLElement) => string,
   *   btnPlay: HTMLButtonElement,
   *   btnPrev: HTMLButtonElement,
   *   btnNext: HTMLButtonElement,
   *   rateSelect: HTMLSelectElement,
   *   statusEl: HTMLElement
   * }} options
   */
  function BibleReader(options) {
    this.getVerseElements = options.getVerseElements;
    this.getEnglishText = options.getEnglishText;
    this.btnPlay = options.btnPlay;
    this.btnPrev = options.btnPrev;
    this.btnNext = options.btnNext;
    this.rateSelect = options.rateSelect;
    this.statusEl = options.statusEl;

    this.index = 0;
    this.playing = false;
    this.rate = parseFloat(this.rateSelect.value) || 1;
    this._bound = {
      play: this.togglePlay.bind(this),
      prev: this.prev.bind(this),
      next: this.next.bind(this),
      rate: this._onRateChange.bind(this)
    };

    if (!global.speechSynthesis) {
      this.statusEl.hidden = false;
      this.statusEl.textContent = "Audio not supported in this browser.";
      this.btnPlay.disabled = true;
      this.btnPrev.disabled = true;
      this.btnNext.disabled = true;
      this.rateSelect.disabled = true;
      this.unsupported = true;
      return;
    }

    this.unsupported = false;
    this.btnPlay.addEventListener("click", this._bound.play);
    this.btnPrev.addEventListener("click", this._bound.prev);
    this.btnNext.addEventListener("click", this._bound.next);
    this.rateSelect.addEventListener("change", this._bound.rate);
    this._syncPlayLabel();
  }

  BibleReader.prototype._onRateChange = function () {
    this.rate = parseFloat(this.rateSelect.value) || 1;
    if (this.playing) {
      this._cancelUtterance();
      this._speakCurrent();
    }
  };

  BibleReader.prototype.setRate = function (rate) {
    this.rate = rate;
    this.rateSelect.value = String(rate);
  };

  BibleReader.prototype.resetToStart = function () {
    this._cancelUtterance();
    this.playing = false;
    this.index = 0;
    this._syncPlayLabel();
    this._applyHighlight();
  };

  BibleReader.prototype.destroy = function () {
    this._cancelUtterance();
    if (this.unsupported) return;
    this.btnPlay.removeEventListener("click", this._bound.play);
    this.btnPrev.removeEventListener("click", this._bound.prev);
    this.btnNext.removeEventListener("click", this._bound.next);
    this.rateSelect.removeEventListener("change", this._bound.rate);
  };

  BibleReader.prototype.togglePlay = function () {
    if (this.unsupported) return;
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  };

  BibleReader.prototype.play = function () {
    if (this.unsupported) return;
    var verses = this._verses();
    if (!verses.length) return;
    if (this.index >= verses.length) this.index = 0;
    this.playing = true;
    this._syncPlayLabel();
    this._speakCurrent();
  };

  BibleReader.prototype.pause = function () {
    this.playing = false;
    this._cancelUtterance();
    this._syncPlayLabel();
  };

  BibleReader.prototype.prev = function () {
    if (this.unsupported) return;
    var verses = this._verses();
    if (!verses.length) return;
    this.index = Math.max(0, this.index - 1);
    this._applyHighlight();
    if (this.playing) {
      this._cancelUtterance();
      this._speakCurrent();
    }
  };

  BibleReader.prototype.next = function () {
    if (this.unsupported) return;
    var verses = this._verses();
    if (!verses.length) return;
    this.index = Math.min(verses.length - 1, this.index + 1);
    this._applyHighlight();
    if (this.playing) {
      this._cancelUtterance();
      this._speakCurrent();
    }
  };

  BibleReader.prototype._verses = function () {
    return Array.prototype.slice.call(this.getVerseElements() || []);
  };

  BibleReader.prototype._cancelUtterance = function () {
    if (global.speechSynthesis) {
      global.speechSynthesis.cancel();
    }
  };

  BibleReader.prototype._syncPlayLabel = function () {
    this.btnPlay.textContent = this.playing ? "Pause" : "Play";
    this.btnPlay.setAttribute("aria-label", this.playing ? "Pause" : "Play");
  };

  BibleReader.prototype._applyHighlight = function () {
    var verses = this._verses();
    for (var i = 0; i < verses.length; i++) {
      verses[i].classList.toggle("is-active", i === this.index);
    }
    var active = verses[this.index];
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  BibleReader.prototype._speakCurrent = function () {
    var self = this;
    var verses = this._verses();
    if (!verses.length || this.index >= verses.length) {
      this.playing = false;
      this._syncPlayLabel();
      return;
    }

    this._applyHighlight();
    var text = (this.getEnglishText(verses[this.index]) || "").trim();
    if (!text) {
      this.index += 1;
      if (this.playing) this._speakCurrent();
      return;
    }

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.lang = "en-US";
    utterance.onend = function () {
      if (!self.playing) return;
      self.index += 1;
      if (self.index >= self._verses().length) {
        self.playing = false;
        self.index = Math.max(0, self._verses().length - 1);
        self._syncPlayLabel();
        self._applyHighlight();
        return;
      }
      self._speakCurrent();
    };
    utterance.onerror = function () {
      self.playing = false;
      self._syncPlayLabel();
    };
    global.speechSynthesis.speak(utterance);
  };

  global.BibleReader = BibleReader;
})(typeof window !== "undefined" ? window : this);
