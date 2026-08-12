/*
	  -------------
	|   ACCORDION   |
	  -------------

	* Basic Attributes:
		* .js-accordions - general wrapper for accordions
		* .js-accordion - accordion block
			** If it is necessary to close neighboring accordions, then specify the data-accordion-one attribute
			** If you want to always display the active accordion (without the possibility of closing), then specify the data-accordion-visible attribute
			** If by default you want to show the accordion, then you need to specify the classes .is-active.is-visible
		* .js-accordion-button - open/close dropdown content button
		* .js-accordion-content - drop-down content
*/

/**
	* @param  {Element} accordionsContainer - HTML container element, default document
	* @param  {number} duration - accordion opening time (also needs to be changed in CSS)
*/
export default function setAccordion(accordionsContainer, duration = 300) {
	let accordions;

	if (accordionsContainer) {
		if (accordionsContainer instanceof Node) {
			accordions = accordionsContainer.querySelectorAll('.js-accordion');
		}
	} else {
		accordions = document.querySelectorAll('.js-accordion');
	}

	if (accordions.length) {
		const accordionInit = (accordionEl) => {
            const accordionButton = accordionEl.querySelector('.js-accordion-button');
            const closeButton = accordionEl.querySelector('.js-accordion-close-button');
			const accordionContent = accordionEl.querySelector('.js-accordion-content');
			let isOpen = true;
			const accordionItem = () => {
				isOpen = false;

				if (accordionEl.hasAttribute('data-accordion-one')) {
					const accordionActive = accordionEl.closest('.js-accordions').querySelector('.js-accordion.is-active');

					if (accordionActive && accordionActive !== accordionEl) {
						const accordionActiveContent = accordionActive.querySelector('.js-accordion-content');

						accordionActive.classList.remove('is-active', 'is-visible');
						accordionButton.setAttribute('aria-expanded', 'false');

						if (accordionActiveContent.style.maxHeight) {
							accordionActiveContent.style.maxHeight = null;
						}
					}
				}

				accordionEl.classList.toggle('is-active');

				accordionContent.style.maxHeight = `${accordionContent.scrollHeight}px`;

				if (accordionEl.classList.contains('is-active')) {
					accordionButton.setAttribute('aria-expanded', 'true');
					setTimeout(() => {
						accordionEl.classList.add('is-visible');
					}, duration);

					setTimeout(() => {
						accordionContent.style.maxHeight = null;
					}, duration);
				} else {
					accordionButton.setAttribute('aria-expanded', 'false');
					accordionEl.classList.remove('is-visible');

					setTimeout(() => {
						accordionContent.style.maxHeight = null;
					}, 1);
				}

				setTimeout(() => {
					isOpen = true;
				}, duration);
			}

			accordionEl.classList.add('is-init');

			if (accordionButton && accordionContent) {
				if (accordionEl.classList.contains('is-active')) {
					accordionButton.setAttribute('aria-expanded', 'true');
				}

				accordionButton.addEventListener('click', (event) => {
					event.preventDefault();

					let isVisible = accordionEl.hasAttribute('data-accordion-visible');

					if (isOpen) {
						if (isVisible) {
							if (!accordionEl.classList.contains('is-active')) {
								accordionItem ();
							}
						} else {
							accordionItem ();
						}
					}
				});
            }

            if (closeButton) {
                closeButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    accordionItem();
                });
            }
		};

		accordions.forEach((accordionEl) => {
			if (!accordionEl.classList.contains('is-init')) {
				accordionInit(accordionEl);
			}
		});
	}
}
