import { useCallback, useEffect, useRef, useState } from 'react';
import { GALLERY } from '../data/site.js';
import NightScene from '../components/NightScene.jsx';
import { Reveal } from '../components/motion.jsx';
import { ArrowLeft, ArrowRight, CloseIcon } from '../components/Icons.jsx';

function Media({ item, large }) {
  if (item.src) {
    return <img src={item.src} alt={item.title} loading={large ? 'eager' : 'lazy'} />;
  }
  return <NightScene variant={item.scene || 'classic'} label={`Illustration: ${item.title}`} />;
}

export default function Gallery() {
  const [index, setIndex] = useState(-1);
  const closeRef = useRef(null);
  const lastTrigger = useRef(null);
  const open = index >= 0;

  const close = useCallback(() => {
    setIndex(-1);
    lastTrigger.current?.focus();
  }, []);
  const step = useCallback((d) => setIndex((i) => (i + d + GALLERY.length) % GALLERY.length), []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('no-scroll');
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close, step]);

  const current = open ? GALLERY[index] : null;

  return (
    <section id="gallery" className="section gallery">
      <div className="container">
        <Reveal className="section-head section-head--split">
          <div>
            <p className="eyebrow">Gallery</p>
            <h2 className="h2">After dark, <em>around Irvine.</em></h2>
          </div>
          <p className="section-head__aside">
            Warm white rooflines, palm trunk wraps, multicolor C9s and more. Tap any frame to look closer.
          </p>
        </Reveal>

        <div className="bento">
          {GALLERY.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 90} className={`bento__cell bento__cell--${item.id}`}>
              <button
                type="button"
                className="bento__btn"
                onClick={(e) => { lastTrigger.current = e.currentTarget; setIndex(i); }}
                aria-label={`Open ${item.title}`}
              >
                <Media item={item} />
                <span className="bento__cap">
                  <span className="bento__title">{item.title}</span>
                  <span className="bento__note">{item.note}</span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={current.title} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <button ref={closeRef} type="button" className="lightbox__close" onClick={close} aria-label="Close"><CloseIcon /></button>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)} aria-label="Previous"><ArrowLeft /></button>
          <figure className="lightbox__fig">
            <div className="lightbox__media"><Media item={current} large /></div>
            <figcaption>
              <span className="lightbox__title">{current.title}</span>
              <span className="lightbox__count">{index + 1} / {GALLERY.length}</span>
            </figcaption>
          </figure>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)} aria-label="Next"><ArrowRight /></button>
        </div>
      )}
    </section>
  );
}
