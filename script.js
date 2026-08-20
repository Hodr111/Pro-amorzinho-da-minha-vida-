(function () {
  "use strict";

  /* ---------- Fix mobile viewport height (iOS/Android browser bars) ---------- */
  function setAppHeight() {
    document.documentElement.style.setProperty("--app-height", window.innerHeight + "px");
  }
  setAppHeight();
  window.addEventListener("resize", setAppHeight);
  window.addEventListener("orientationchange", setAppHeight);

  /* ---------- Navigation ---------- */
  var pages = Array.prototype.slice.call(document.querySelectorAll(".page"));
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var counter = document.getElementById("counter");

  var current = 0;
  var isAnimating = false;
  var ANIMATION_MS = 620;

  function render() {
    pages.forEach(function (page, i) {
      page.classList.remove("active", "past");
      if (i === current) {
        page.classList.add("active");
        page.setAttribute("aria-hidden", "false");
      } else {
        page.setAttribute("aria-hidden", "true");
        if (i < current) page.classList.add("past");
      }
    });

    counter.textContent = (current + 1) + " / " + pages.length;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === pages.length - 1;
  }

  function goTo(index) {
    var next = Math.max(0, Math.min(pages.length - 1, index));
    if (next === current || isAnimating) return;

    current = next;
    isAnimating = true;
    render();

    window.setTimeout(function () {
      isAnimating = false;
    }, ANIMATION_MS);
  }

  prevBtn.addEventListener("click", function () { goTo(current - 1); });
  nextBtn.addEventListener("click", function () { goTo(current + 1); });

  document.querySelectorAll(".next-page").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      goTo(current + 1);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.repeat) return;
    if (event.key === "ArrowRight") goTo(current + 1);
    else if (event.key === "ArrowLeft") goTo(current - 1);
  });

  /* ---------- Swipe (touch) navigation ----------
     Only treats the gesture as a page-swipe once horizontal intent is
     clear, so vertical scrolling inside a long letter keeps working. */
  var touchStartX = 0;
  var touchStartY = 0;
  var touchActive = false;
  var horizontalIntent = false;
  var SWIPE_THRESHOLD = 55;
  var DIRECTION_LOCK = 12;

  document.addEventListener("touchstart", function (event) {
    if (event.target.closest("button, a, .music-card")) {
      touchActive = false;
      return;
    }
    var touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchActive = true;
    horizontalIntent = false;
  }, { passive: true });

  document.addEventListener("touchmove", function (event) {
    if (!touchActive) return;
    var touch = event.touches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;

    if (!horizontalIntent && Math.abs(dx) > DIRECTION_LOCK && Math.abs(dx) > Math.abs(dy)) {
      horizontalIntent = true;
    }

    if (horizontalIntent && event.cancelable) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener("touchend", function (event) {
    if (!touchActive) return;
    touchActive = false;

    if (!horizontalIntent) return;

    var touch = event.changedTouches[0];
    var distance = touch.clientX - touchStartX;

    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      goTo(current + (distance < 0 ? 1 : -1));
    }
  }, { passive: true });

  document.addEventListener("touchcancel", function () {
    touchActive = false;
    horizontalIntent = false;
  }, { passive: true });

  render();

  /* ---------- Local music player ---------- */
  var audio = document.getElementById("song");
  var playBtn = document.getElementById("musicToggle");
  var fallback = document.getElementById("musicFallback");
  var hasAudioError = false;

  function showFallback() {
    if (hasAudioError) return;
    hasAudioError = true;
    fallback.hidden = false;
    playBtn.disabled = true;
    playBtn.textContent = "▶";
    playBtn.setAttribute("aria-label", "Música indisponível");
  }

  function updatePlayButton() {
    if (hasAudioError) return;
    var playing = !audio.paused && !audio.ended;
    playBtn.textContent = playing ? "❚❚" : "▶";
    playBtn.classList.toggle("playing", playing);
    playBtn.setAttribute("aria-label", playing ? "Pausar música" : "Tocar música");
  }

  playBtn.addEventListener("click", function () {
    if (hasAudioError) return;

    if (audio.paused) {
      var playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          showFallback();
        });
      }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", updatePlayButton);
  audio.addEventListener("pause", updatePlayButton);
  audio.addEventListener("ended", updatePlayButton);
  audio.addEventListener("error", showFallback);
  audio.querySelector("source").addEventListener("error", showFallback);

  updatePlayButton();
})();
