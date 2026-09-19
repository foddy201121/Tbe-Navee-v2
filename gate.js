'use strict';
// Key gate. The app scripts (i18n.js, app.js) are only loaded after the correct key is entered.
// Only a salted SHA-256 of the key is stored here, not the key itself.
(function () {
  var KEY_HASH = '19a321cde6c6fd0894cd7a5aef9aabe9ef954f4a4088bb71c833d2fc2d04fc0b';
  var SALT = 'nvgate1:';
  var STORE = 'navee.gate';
  var root = document.documentElement;

  function sha256Hex(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.body.appendChild(s);
    });
  }

  var started = false;
  function unlock() {
    if (started) return;
    started = true;
    var g = document.getElementById('gate');
    if (g) g.remove();
    root.classList.remove('locked');
    loadScript('i18n.js?v=56').then(function () { return loadScript('app.js?v=56'); });
  }

  function check(key) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve(false);
    return sha256Hex(SALT + key).then(function (h) { return h === KEY_HASH; });
  }

  var input = document.getElementById('gate-key');
  var btn = document.getElementById('gate-go');
  var msg = document.getElementById('gate-msg');

  function submit() {
    var v = input.value.trim();
    if (!v) return;
    check(v).then(function (ok) {
      if (ok) {
        try { localStorage.setItem(STORE, v); } catch (e) {}
        unlock();
      } else {
        msg.textContent = 'Wrong key.';
        input.value = '';
        input.focus();
      }
    });
  }

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });

  // Remembered key from an earlier visit: verify it again instead of trusting a flag.
  var saved = null;
  try { saved = localStorage.getItem(STORE); } catch (e) {}
  if (saved) {
    check(saved).then(function (ok) {
      if (ok) unlock();
      else { try { localStorage.removeItem(STORE); } catch (e) {} }
    });
  }
})();
