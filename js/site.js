// Gallery behaviour: the gallery cards open one gallery at a time, and gallery
// photos open full size in a lightbox. Without JS every gallery stays on the
// page as a normal <details> block and the photo links open the image.
(function () {
  'use strict';

  // Galleries stay hidden until their card is clicked, also when the page is
  // loaded with a gallery hash in the address.
  const galleryIndex = document.querySelector('.gallery-jump');
  const cards = Array.from(document.querySelectorAll('.gallery-jump a[href^="#"]'));
  const galleries = Array.from(document.querySelectorAll('.gallery-block'))
    .filter((block) => block.querySelector('details.gallery-disclosure'));

  galleries.forEach((block) => block.classList.add('is-collapsible'));

  function showGallery(id) {
    galleries.forEach((block) => {
      const active = block.id === id;
      const details = block.querySelector('details.gallery-disclosure');
      block.classList.toggle('is-active', active);
      if (details.open !== active) details.open = active;
    });
    cards.forEach((card) => {
      const active = card.getAttribute('href') === '#' + id;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-expanded', String(active));
    });
  }

  cards.forEach((card) => {
    card.setAttribute('aria-expanded', 'false');
    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (card.classList.contains('is-active')) {
        showGallery(null);
        return;
      }
      const id = card.getAttribute('href').slice(1);
      showGallery(id);
      document.getElementById(id).scrollIntoView({ block: 'start' });
    });
  });

  // Closing a gallery from its own sticky button hides it again and brings the
  // reader back to the gallery cards instead of somewhere below them.
  galleries.forEach((block) => {
    const details = block.querySelector('details.gallery-disclosure');
    details.addEventListener('toggle', () => {
      if (details.open || !block.classList.contains('is-active')) return;
      showGallery(null);
      if (galleryIndex && galleryIndex.getBoundingClientRect().top < 0) galleryIndex.scrollIntoView({ block: 'start' });
    });
  });

  if (typeof HTMLDialogElement !== 'function') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Photo viewer');
  dialog.innerHTML =
    '<div class="lightbox-bar">' +
      '<span class="lightbox-count"></span>' +
      '<button type="button" class="lightbox-close">Close <span aria-hidden="true">✕</span></button>' +
    '</div>' +
    '<div class="lightbox-stage">' +
      '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous photo">←</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button type="button" class="lightbox-nav lightbox-next" aria-label="Next photo">→</button>' +
    '</div>' +
    '<p class="lightbox-caption"></p>';
  document.body.appendChild(dialog);

  const img = dialog.querySelector('.lightbox-img');
  const count = dialog.querySelector('.lightbox-count');
  const caption = dialog.querySelector('.lightbox-caption');
  let items = [];
  let index = 0;

  function show(i) {
    index = (i + items.length) % items.length;
    const link = items[index];
    const thumb = link.querySelector('img');
    const title = link.parentNode.querySelector('figcaption span');
    img.src = link.href;
    img.alt = thumb.alt;
    caption.textContent = title ? title.textContent : '';
    count.textContent = (index + 1) + ' / ' + items.length;
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.lightbox-link');
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    items = Array.from(link.closest('.gallery-grid').querySelectorAll('.lightbox-link'));
    dialog.classList.toggle('lightbox-single', items.length < 2);
    show(items.indexOf(link));
    dialog.showModal();
    document.body.classList.add('lightbox-open');
  });

  dialog.addEventListener('close', () => {
    if (dialog.open) return; // reopened before this event fired
    document.body.classList.remove('lightbox-open');
    img.removeAttribute('src');
  });

  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => show(index + 1));

  // Clicking the dark area around the photo closes the viewer.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.classList.contains('lightbox-stage')) dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // Swipe left/right on touch screens.
  let touchX = null;
  dialog.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(dx > 0 ? index - 1 : index + 1);
  });
})();
