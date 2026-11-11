/* Jurassic Trail — aviso de cookies e links legais (LGPD).
 *
 * O site hoje NÃO usa cookies próprios, analytics, pixels ou rastreadores.
 * Este script:
 *  1. mostra um aviso de privacidade até o visitante escolher uma opção;
 *  2. guarda essa escolha apenas no navegador do visitante (localStorage);
 *  3. adiciona os links das páginas legais no rodapé;
 *  4. expõe window.jtConsent para que qualquer ferramenta futura (ex.: analytics)
 *     só seja carregada se o visitante tiver aceitado.
 *
 * Para carregar algo só com consentimento no futuro:
 *   window.jtConsent.onAccept(function () { ...carregar o script... });
 */
(function () {
  'use strict';

  var KEY = 'jt-consent-v1';
  var POLICY_VERSION = '2026-11-11';
  var LINKS = [
    { href: './politica-de-privacidade/', label: 'Privacidade' },
    { href: './politica-de-cookies/', label: 'Cookies' },
    { href: './termos-de-uso/', label: 'Termos de uso' }
  ];
  var listeners = [];

  function read() {
    try {
      var v = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      return v && v.version === POLICY_VERSION ? v : null;
    } catch (e) { return null; }
  }

  function save(choice) {
    var v = { choice: choice, version: POLICY_VERSION, date: new Date().toISOString() };
    try { window.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* navegação privada */ }
    return v;
  }

  function notify(v) {
    try { document.dispatchEvent(new CustomEvent('jt-consent', { detail: v })); } catch (e) {}
    if (v.choice === 'all') listeners.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  window.jtConsent = {
    get: read,
    accepted: function () { var v = read(); return !!(v && v.choice === 'all'); },
    onAccept: function (fn) { if (this.accepted()) fn(); else listeners.push(fn); },
    open: showBanner,
    reset: function () { try { window.localStorage.removeItem(KEY); } catch (e) {} showBanner(); }
  };

  var banner = null;

  function showBanner() {
    if (banner) return;
    banner = document.createElement('section');
    banner.className = 'jt-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de privacidade e cookies');
    banner.innerHTML =
      '<p class="jt-consent__eyebrow">Privacidade</p>' +
      '<p class="jt-consent__text">Este site não usa cookies de rastreamento nem de publicidade. ' +
      'Guardamos apenas a sua escolha neste aviso, no seu próprio navegador. ' +
      'Saiba mais na <a href="./politica-de-cookies/">Política de Cookies</a> e na ' +
      '<a href="./politica-de-privacidade/">Política de Privacidade</a>.</p>' +
      '<div class="jt-consent__actions">' +
      '<button type="button" class="jt-consent__btn jt-consent__btn--primary" data-choice="all">Aceitar</button>' +
      '<button type="button" class="jt-consent__btn" data-choice="essential">Somente essenciais</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-choice]') : null;
      if (!btn) return;
      notify(save(btn.getAttribute('data-choice')));
      hideBanner();
    });
    document.body.appendChild(banner);
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { if (banner) banner.classList.add('is-visible'); });
    });
  }

  function hideBanner() {
    if (!banner) return;
    var el = banner;
    banner = null;
    el.classList.remove('is-visible');
    window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
  }

  /* Links legais: entram discretamente na linha do copyright do rodapé,
     herdando a mesma fonte, tamanho e cor do texto ao redor. */
  function addFooterLinks() {
    var footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.jt-legal-links')) return !!footer;
    var copy = null;
    var ps = footer.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].textContent.indexOf('©') !== -1) { copy = ps[i]; break; }
    }
    if (!copy) return false;
    var span = document.createElement('span');
    span.className = 'jt-legal-links';
    var html = '';
    LINKS.forEach(function (l) { html += ' · <a href="' + l.href + '">' + l.label + '</a>'; });
    html += ' · <a href="#" data-jt-prefs>Preferências de cookies</a>';
    span.innerHTML = html;
    span.querySelector('[data-jt-prefs]').addEventListener('click', function (e) {
      e.preventDefault();
      window.jtConsent.reset();
    });
    copy.appendChild(span);
    return true;
  }

  function init() {
    if (!read()) showBanner();
    if (addFooterLinks()) return;
    var obs = new MutationObserver(function () { if (addFooterLinks()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(function () { obs.disconnect(); }, 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
