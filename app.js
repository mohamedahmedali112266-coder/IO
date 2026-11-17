(function () {
  'use strict';
  var S = window.SITE, $ = function (i) { return document.getElementById(i); };
  var cache = {}, cur = 0;

  /* ---------- النصوص من config.js ---------- */
  document.title = S.name + ' | أكواد وألعاب';
  $('nm').textContent = S.name; $('nm').setAttribute('aria-label', S.name);
  $('tg').textContent = S.tagline; $('ab').textContent = S.about;
  $('cp').textContent = '© ' + new Date().getFullYear() + ' ' + S.name;
  if (S.github) { var g = $('gh'); g.href = 'https://github.com/' + S.github; g.hidden = false; }

  /* ---------- أدوات صغيرة ---------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function sp(c, t) { return '<span class="' + c + '">' + esc(t) + '</span>'; }
  function scan(s, re, fn, gap) {
    var out = '', i = 0, m; re.lastIndex = 0;
    while ((m = re.exec(s))) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      if (m.index > i) out += gap ? gap(s.slice(i, m.index)) : esc(s.slice(i, m.index));
      out += fn(m); i = re.lastIndex;
    }
    if (i < s.length) out += gap ? gap(s.slice(i)) : esc(s.slice(i));
    return out;
  }
  function toast(t) { var e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { e.hidden = true; }, 1800); }
  function fmtSize(n) { return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB'; }
  function nameOf(f) { return f.split('/').pop(); }

  /* ---------- تلوين الكود ---------- */
  var KW = 'break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await|of|static|get|set';
  var JRE = new RegExp([/\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/.source, /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?/.source,
    /\b0x[\da-fA-F]+\b|\b\d[\d_]*\.?\d*(?:e[+-]?\d+)?\b/.source, '\\b(?:' + KW + ')\\b', '\\b(?:true|false|null|undefined|NaN|Infinity)\\b',
    '\\b(?:console|document|window|Math|JSON|Array|Object|String|Number|Date|Promise|Map|Set|localStorage|setTimeout|setInterval|fetch)\\b',
    /[A-Za-z_$][\w$]*(?=\s*\()/.source, /=>|[{}()\[\];,.]|[+\-*\/%=<>!&|^~?:]+/.source].map(function (s) { return '(' + s + ')'; }).join('|'), 'g');
  var JC = ['com', 'str', 'num', 'kw', 'num', 'bi', 'fn', 'pun'];
  function hlJs(s) { return scan(s, JRE, function (m) { for (var i = 1; i < m.length; i++) if (m[i] !== undefined) return sp(JC[i - 1], m[i]); return esc(m[0]); }); }
  var CRE = /(\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(@[\w-]+)|(#[\da-fA-F]{3,8}\b)|(\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|ms|s|deg|fr|ch)?)|(--[\w-]+|[\w-]+(?=\s*:))|([{}])|(!important)/g;
  function hlCss(s) {
    var d = 0;
    return scan(s, CRE, function (m) {
      var t = m[0];
      if (m[1]) return sp('com', t); if (m[2]) return sp('str', t); if (m[3] || m[8]) return sp('kw', t); if (m[4] || m[5]) return sp('num', t);
      if (m[6]) return /^\s*:[^;{}]*\{/.test(s.slice(m.index + t.length, m.index + t.length + 160)) ? sp('sel', t) : (d > 0 ? sp('prop', t) : sp('sel', t));
      if (m[7]) { d += t === '{' ? 1 : -1; if (d < 0) d = 0; } return sp('pun', t);
    }, function (g) { return d === 0 ? sp('sel', g) : esc(g); });
  }
  function hlTag(t) {
    var m = /^(<\/?!?)([\w:-]*)([\s\S]*?)(\/?>?)$/.exec(t); if (!m) return esc(t);
    var a = scan(m[3], /([^\s=<>"'\/]+)(\s*=\s*)?("[^"]*"?|'[^']*'?|[^\s"'<>\/]+)?/g, function (q) { return sp('prop', q[1]) + (q[2] ? sp('pun', q[2]) : '') + (q[3] ? sp('str', q[3]) : ''); });
    return sp('pun', m[1]) + sp('tagn', m[2]) + a + sp('pun', m[4]);
  }
  var HRE = /(<!--[\s\S]*?(?:-->|$))|(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\3\s*>|$)|(<!?\/?[A-Za-z][^<>]*>?)/gi;
  function hlHtml(s) {
    return scan(s, HRE, function (m) {
      if (m[1]) return sp('com', m[1]);
      if (m[2] !== undefined) return hlTag(m[2]) + (m[3].toLowerCase() === 'script' ? hlJs(m[4]) : hlCss(m[4])) + (m[5] ? hlTag(m[5]) : '');
      return hlTag(m[6]);
    });
  }

  /* ---------- المشاريع ---------- */
  function card(p, i) {
    var el = document.createElement('article'); el.className = 'card'; el.dataset.kind = p.kind;
    el.innerHTML = '<div class="file"><span>' + esc(nameOf(p.file)) + '</span><span class="sz" data-i="' + i + '"></span></div>' +
      '<h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p>' + (p.note ? '<p class="note">' + esc(p.note) + '</p>' : '') +
      '<div class="tags">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="acts"><a class="btn pri" href="' + esc(p.file) + '" target="_blank" rel="noopener">' + (p.kind === 'لعبة' ? 'العب' : 'افتح') + '</a><button class="btn" type="button" data-code="' + i + '">اعرض الكود</button></div>';
    return el;
  }
  var grid = $('grid');
  S.projects.forEach(function (p, i) { grid.appendChild(card(p, i)); });
  grid.addEventListener('click', function (e) { var b = e.target.closest('[data-code]'); if (!b) return; show(+b.dataset.code); $('code').scrollIntoView(); });
  var kinds = ['الكل'].concat(S.projects.map(function (p) { return p.kind; }).filter(function (k, i, a) { return a.indexOf(k) === i; }));
  $('chips').innerHTML = kinds.map(function (k, i) { return '<button type="button" class="chip" aria-pressed="' + (i === 0) + '">' + k + '</button>'; }).join('');
  $('chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    document.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b); });
    document.querySelectorAll('.card').forEach(function (c) { c.hidden = b.textContent !== 'الكل' && c.dataset.kind !== b.textContent; });
  });

  /* ---------- عارض الكود ---------- */
  $('vt').innerHTML = S.projects.map(function (p, i) { return '<button type="button" role="tab" data-i="' + i + '" aria-selected="false">' + esc(nameOf(p.file)) + '</button>'; }).join('');
  $('vt').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) show(+b.dataset.i); });
  function load(p) {
    if (cache[p.file]) return Promise.resolve(cache[p.file]);
    return fetch(p.file).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (t) { cache[p.file] = t; return t; });
  }
  function show(i) {
    cur = i; var p = S.projects[i];
    document.querySelectorAll('#vt button').forEach(function (b, k) { b.setAttribute('aria-selected', k === i); });
    $('vdl').href = p.file; $('vdl').setAttribute('download', nameOf(p.file));
    $('src').textContent = 'جارٍ التحميل…'; $('gut').textContent = '';
    load(p).then(function (t) {
      if (cur !== i) return;
      var n = t.split('\n').length, a = [];
      for (var k = 1; k <= n; k++) a.push(k);
      $('gut').textContent = a.join('\n');
      $('src').innerHTML = hlHtml(t);
      $('vinfo').innerHTML = '<bdi>' + esc(nameOf(p.file)) + '</bdi> · <bdi>' + n + '</bdi> سطر · <bdi>' + fmtSize(new Blob([t]).size) + '</bdi>';
      $('vw').scrollTop = 0; $('vw').scrollLeft = 0;
    }).catch(function () {
      $('src').textContent = 'تعذّر تحميل الملف. افتح الموقع من GitHub Pages أو من سيرفر محلي (فتح index.html مباشرة من الجهاز لا يسمح بقراءة الملفات).';
      $('vinfo').textContent = '';
    });
  }
  $('vcopy').addEventListener('click', function () {
    var t = cache[S.projects[cur].file]; if (!t) return;
    function fb() { var x = document.createElement('textarea'); x.value = t; x.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(x); x.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} x.remove(); toast(ok ? 'تم نسخ الكود' : 'تعذّر النسخ'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('تم نسخ الكود'); }, fb); else fb();
  });
  show(0);

  /* ---------- إحصائيات حية: عدد المشاريع والأسطر ---------- */
  Promise.all(S.projects.map(function (p) { return load(p).catch(function () { return null; }); })).then(function (all) {
    if (all.some(function (t) { return t === null; })) return;
    var lines = all.reduce(function (s, t) { return s + t.split('\n').length; }, 0);
    $('st').textContent = S.projects.length.toLocaleString('ar-EG') + ' مشاريع · ' + lines.toLocaleString('ar-EG') + ' سطر كود';
    document.querySelectorAll('.sz').forEach(function (e, i) { e.textContent = fmtSize(new Blob([all[i]]).size); });
  });
})();
