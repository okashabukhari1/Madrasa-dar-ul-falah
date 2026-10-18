(() => {
  const $ = id => document.getElementById(id);
  const book = $('book'), wrap = $('bookWrap'), singleWrap = $('singleWrap');
  const sheets = [...book.querySelectorAll('.sheet')];
  const leaves = [...document.querySelectorAll('.leaf')];
  const prevBtn = $('prevBtn'), nextBtn = $('nextBtn'), status = $('status');
  const mq = matchMedia('(max-width:800px)');

  const spreadLabels = ['سرورق', 'صفحات ۱ – ۲', 'صفحات ۳ – ۴'];
  const pageLabels = ['سرورق', 'صفحہ ۱', 'صفحہ ۲', 'صفحہ ۳', 'صفحہ ۴'];
  const DURATION = 1000;
  let spread = 0;   // desktop: 0..sheets.length-1
  let page = 0;     // mobile: 0..leaves.length-1
  let busy = false;

  const isSingle = () => mq.matches;

  // Depth order (translateZ) keeps stacked sheets in the right order while they turn.
  function restingZ() {
    sheets.forEach((s, i) => s.style.setProperty('--z', ((s.classList.contains('flipped') ? i + 1 : sheets.length - i) * 4) + 'px'));
    leaves.forEach((l, i) => l.style.setProperty('--z', ((l.classList.contains('flipped') ? i + 1 : leaves.length - i) * 4) + 'px'));
  }

  function render() {
    if (isSingle()) {
      status.textContent = pageLabels[page];
      prevBtn.disabled = page === 0;
      nextBtn.disabled = page === leaves.length - 1;
    } else {
      book.dataset.state = spread;
      status.textContent = spreadLabels[spread];
      prevBtn.disabled = spread === 0;
      nextBtn.disabled = spread === sheets.length - 1;
    }
  }

  function turn(dir) {
    if (busy) return;
    const single = isSingle();
    const items = single ? leaves : sheets;
    const cur = single ? page : spread;
    const max = single ? leaves.length - 1 : sheets.length - 1;
    const target = cur + dir;
    if (target < 0 || target > max) return;
    busy = true;
    const el = items[dir > 0 ? cur : target];
    el.style.setProperty('--z', '20px');          // above the others while turning
    el.classList.add('turning');
    el.classList.toggle('flipped', dir > 0);
    single ? (page = target) : (spread = target);
    render();
    setTimeout(() => { el.classList.remove('turning'); restingZ(); busy = false; }, DURATION);
  }
  const next = () => turn(1), prev = () => turn(-1);

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  [...sheets, ...leaves].forEach(el =>
    el.addEventListener('click', () => el.classList.contains('flipped') ? prev() : next()));

  // Urdu book: unread pages are on the left, so ArrowLeft = next
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') next();
    if (e.key === 'ArrowRight') prev();
  });

  // Swipe: drag left = next, drag right = previous
  let x0 = null;
  [wrap, singleWrap].forEach(w => {
    w.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    w.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
      x0 = null;
    });
  });

  // Keep both layouts in step when the screen size crosses the mobile breakpoint
  function sync(fromSingle) {
    if (fromSingle !== undefined) {
      if (fromSingle) spread = page === 0 ? 0 : page <= 2 ? 1 : 2;
      else page = spread === 0 ? 0 : spread === 1 ? 1 : 3;
    }
    sheets.forEach((s, i) => s.classList.toggle('flipped', i < spread));
    leaves.forEach((l, i) => l.classList.toggle('flipped', i < page));
    restingZ(); render();
  }
  let wasSingle = isSingle();
  mq.addEventListener('change', () => { sync(wasSingle); wasSingle = isSingle(); });

  // Loading screen: wait for every image in the page, then fade out
  const imgs = [...document.images];
  const bar = $('loaderBar');
  const started = Date.now();
  let loaded = 0;
  const step = () => {
    bar.style.width = (++loaded / imgs.length * 100) + '%';
    if (loaded === imgs.length) {
      setTimeout(() => {
        $('loader').classList.add('done');
        document.body.classList.remove('is-loading');
      }, Math.max(0, 1600 - (Date.now() - started)));
    }
  };
  imgs.forEach(im => im.complete ? step() : (im.onload = im.onerror = step));

  sync();
})();