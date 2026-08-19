(function () {
  "use strict";

  var STORAGE_KEY = "bible-reader-plan";
  var TOTAL = 364;
  var DAY_MS = 24 * 60 * 60 * 1000;

  var planData = null;
  var progress = null;
  var filter = "next";
  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function readProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return defaultProgress();
      parsed.completed = parsed.completed || {};
      parsed.status = parsed.status || "idle";
      return parsed;
    } catch (e) {
      return defaultProgress();
    }
  }

  function defaultProgress() {
    return { status: "idle", startedAt: null, completed: {}, lastCompletedAt: null };
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      /* ignore */
    }
  }

  function completedCount() {
    return Object.keys(progress.completed || {}).length;
  }

  function isDone(id) {
    return Boolean(progress.completed && progress.completed[id]);
  }

  function formatDate(ms) {
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function projectedCopy() {
    var done = completedCount();
    if (!progress.startedAt || done === 0) {
      return "Complete a reading to see a projected finish date.";
    }
    var elapsedDays = Math.max((Date.now() - progress.startedAt) / DAY_MS, 1 / 24);
    var rate = done / elapsedDays;
    var remaining = TOTAL - done;
    if (remaining <= 0) return "You finished the plan.";
    var daysLeft = remaining / rate;
    var finish = Date.now() + daysLeft * DAY_MS;
    var perDay = rate.toFixed(rate >= 1 ? 1 : 2);
    return (
      "At " +
      perDay +
      " reading" +
      (Number(perDay) === 1 ? "" : "s") +
      "/day, projected finish " +
      formatDate(finish) +
      "."
    );
  }

  function setOpen(open) {
    if (!els.panel || !els.toggle) return;
    els.panel.hidden = !open;
    els.toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("plan-open", open);
    if (open) render();
  }

  function startPlan() {
    progress = {
      status: "active",
      startedAt: Date.now(),
      completed: {},
      lastCompletedAt: null
    };
    saveProgress();
    filter = "next";
    render();
  }

  function cancelPlan() {
    if (!window.confirm("Clear all reading-plan progress and start over?")) return;
    progress = defaultProgress();
    saveProgress();
    filter = "next";
    render();
  }

  function restartPlan() {
    if (progress.status !== "complete") return;
    startPlan();
  }

  function toggleReading(id) {
    if (progress.status === "idle") return;
    if (isDone(id)) {
      delete progress.completed[id];
    } else {
      progress.completed[id] = Date.now();
      progress.lastCompletedAt = Date.now();
    }
    if (completedCount() >= TOTAL) {
      progress.status = "complete";
    } else if (progress.status === "complete") {
      progress.status = "active";
    }
    saveProgress();
    render();
  }

  function openReading(reading) {
    if (!window.BibleApp || typeof window.BibleApp.navigate !== "function") return;
    setOpen(false);
    window.BibleApp.navigate(reading.book, reading.chapterStart, {
      id: reading.id,
      label: reading.label,
      book: reading.book,
      chapterStart: reading.chapterStart,
      chapterEnd: reading.chapterEnd
    });
  }

  function readingsForFilter() {
    var list = planData.readings;
    if (filter === "all") return list;
    if (filter === "done") return list.filter(function (r) { return isDone(r.id); });
    if (filter === "open") return list.filter(function (r) { return !isDone(r.id); });
    var next = [];
    for (var i = 0; i < list.length; i++) {
      if (!isDone(list[i].id)) {
        next.push(list[i]);
        if (next.length >= 14) break;
      }
    }
    return next;
  }

  function renderStatus() {
    var done = completedCount();
    var pct = Math.round((done / TOTAL) * 100);
    var html = "";

    if (progress.status === "idle") {
      html =
        "<p>364 readings covering the whole Bible. Mark each range when you finish it — at your own pace, not by calendar week.</p>";
    } else {
      html =
        '<div class="plan-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' +
        TOTAL +
        '" aria-valuenow="' +
        done +
        '" aria-label="Reading plan progress">' +
        '<span style="width:' +
        pct +
        '%"></span></div>' +
        '<p class="plan-counts"><strong>' +
        done +
        "</strong> of " +
        TOTAL +
        " complete (" +
        pct +
        "%)</p>" +
        '<p class="plan-projection">' +
        projectedCopy() +
        "</p>";
      if (progress.startedAt) {
        html += '<p class="plan-started">Started ' + formatDate(progress.startedAt) + "</p>";
      }
      if (progress.status === "complete") {
        html += '<p class="plan-complete">Plan complete. You can restart a new cycle.</p>';
      }
    }
    els.status.innerHTML = html;
  }

  function renderActions() {
    var html = "";
    if (progress.status === "idle") {
      html = '<button type="button" class="btn-primary" id="plan-start">Start plan</button>';
    } else {
      html =
        '<button type="button" id="plan-cancel">Cancel progress</button>';
      if (progress.status === "complete") {
        html += '<button type="button" class="btn-primary" id="plan-restart">Restart plan</button>';
      }
    }
    els.actions.innerHTML = html;
  }

  function renderFilters() {
    var show = progress.status !== "idle";
    els.filters.hidden = !show;
    if (!show) return;
    var buttons = els.filters.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("is-active", buttons[i].getAttribute("data-filter") === filter);
    }
  }

  function renderList() {
    if (progress.status === "idle") {
      els.list.innerHTML =
        "<p class=" +
        '"plan-empty">Start the plan to check off readings. Each range opens in the reader.</p>';
      return;
    }

    var items = readingsForFilter();
    if (!items.length) {
      els.list.innerHTML = '<p class="plan-empty">Nothing in this view.</p>';
      return;
    }

    var html = "";
    var week = null;
    items.forEach(function (r) {
      if (r.week !== week) {
        week = r.week;
        html += '<h3 class="plan-week">Group ' + r.week + "</h3>";
      }
      var done = isDone(r.id);
      html +=
        '<div class="plan-row' +
        (done ? " is-done" : "") +
        '">' +
        '<label class="plan-check"><input type="checkbox" data-toggle="' +
        r.id +
        '"' +
        (done ? " checked" : "") +
        " /><span class=" +
        '"visually-hidden">Mark ' +
        r.label +
        " complete</span></label>" +
        '<button type="button" class="plan-link" data-open="' +
        r.id +
        '"><span class="plan-cat">' +
        r.category +
        "</span><span class=" +
        '"plan-label">' +
        r.label +
        "</span></button></div>";
    });
    els.list.innerHTML = html;
  }

  function render() {
    if (!planData || !els.status) return;
    renderStatus();
    renderActions();
    renderFilters();
    renderList();
  }

  function bind() {
    els.toggle.addEventListener("click", function () {
      setOpen(els.panel.hidden);
    });
    els.close.addEventListener("click", function () {
      setOpen(false);
    });
    els.filters.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filter = btn.getAttribute("data-filter");
      render();
    });
    els.actions.addEventListener("click", function (e) {
      if (e.target.id === "plan-start") startPlan();
      if (e.target.id === "plan-cancel") cancelPlan();
      if (e.target.id === "plan-restart") restartPlan();
    });
    els.list.addEventListener("change", function (e) {
      var id = e.target.getAttribute("data-toggle");
      if (id) toggleReading(id);
    });
    els.list.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-open]");
      if (!btn) return;
      var id = btn.getAttribute("data-open");
      var reading = planData.readings.filter(function (r) {
        return r.id === id;
      })[0];
      if (reading) openReading(reading);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !els.panel.hidden) setOpen(false);
    });
  }

  function init() {
    els = {
      toggle: $("plan-toggle"),
      panel: $("plan-panel"),
      close: $("plan-close"),
      status: $("plan-status"),
      actions: $("plan-actions"),
      filters: $("plan-filters"),
      list: $("plan-list")
    };
    if (!els.panel) return;
    progress = readProgress();
    bind();

    fetch("json/reading-plan.json")
      .then(function (r) {
        if (!r.ok) throw new Error("plan");
        return r.json();
      })
      .then(function (data) {
        planData = data;
        TOTAL = data.total || data.readings.length;
        if (progress.status === "active" && completedCount() >= TOTAL) {
          progress.status = "complete";
          saveProgress();
        }
        render();
      })
      .catch(function () {
        els.status.innerHTML = "<p>Couldn’t load the reading plan.</p>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
