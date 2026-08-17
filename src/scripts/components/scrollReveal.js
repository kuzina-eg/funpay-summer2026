/*
    Появление блоков при скролле.

      [data-scroll-reveal]   — блок, который выезжает; получает класс is-visible
      data-reveal-threshold  — какая доля блока должна попасть во вьюпорт (по умолчанию .2)

    Сама анимация в CSS: модуль только ставит класс. Без IntersectionObserver
    и при prefers-reduced-motion блоки показываются сразу.
*/

export default function initScrollReveal() {
    const blocks = document.querySelectorAll('[data-scroll-reveal]');
    if (!blocks.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
        blocks.forEach((block) => block.classList.add('is-visible'));
        return;
    }

    blocks.forEach((block) => {
        const threshold = parseFloat(block.getAttribute('data-reveal-threshold')) || .2;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold });

        observer.observe(block);
    });
}
