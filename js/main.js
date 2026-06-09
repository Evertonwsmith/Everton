/*
  ================================================================
  MAIN JAVASCRIPT - Single Page Portfolio
  ================================================================
  This file handles:

    1. Mobile menu toggle (hamburger open/close)
    2. Active navigation link highlighting via IntersectionObserver
    3. Smooth scroll behavior (CSS handles most, JS for edge cases)
    4. Dynamic year in footer copyright

  INSTRUCTIONS:
    - All functions are wrapped in DOMContentLoaded to ensure
      the DOM is fully loaded before any script runs.
    - Use modern ES6+ syntax (const, let, arrow functions).
    - No external dependencies (vanilla JS only).
    - Fill in TODO comments with actual logic/values as needed.
  ================================================================
*/

/**
 * ================================================================
 * DOMContentLoaded - Entry Point
 * ================================================================
 * - Fires after the HTML document has been completely loaded.
 * - Initializes all site functionality.
 * ================================================================
 */
document.addEventListener('DOMContentLoaded', () => {

    /*
      ------------------------------------------------------------------
      1. CACHE DOM ELEMENTS
      ------------------------------------------------------------------
      - References to key DOM nodes used across multiple functions.
      - Caching improves performance and keeps code DRY.
      ------------------------------------------------------------------
    */
    const header    = document.querySelector('.site-header');
    const menuBtn   = document.querySelector('.menu-toggle');
    const navLinks  = document.querySelectorAll('.nav-link');
    const sections  = document.querySelectorAll('.section[id]');
    const yearSpan  = document.getElementById('current-year');

    /*
      ------------------------------------------------------------------
      2. MOBILE MENU TOGGLE
      ------------------------------------------------------------------
      - Clicking the hamburger button toggles the .nav-open class
        on .site-header, which shows/hides the mobile navigation.
      - aria-expanded is updated for accessibility.
      - Clicking a nav link closes the menu on mobile.
      ------------------------------------------------------------------
    */

    /**
     * toggleMobileMenu
     * ----------------
     * Toggles the mobile navigation menu open/closed.
     * Also updates aria-expanded attribute on the toggle button
     * for screen reader accessibility.
     */
    function toggleMobileMenu() {
        if (!header || !menuBtn) return;

        // TODO: Add/remove .nav-open class on .site-header
        const isOpen = header.classList.toggle('nav-open');

        // Update aria-expanded to reflect current state
        menuBtn.setAttribute('aria-expanded', isOpen);

        // TODO: Optionally disable body scroll when menu is open
        // document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    /**
     * closeMobileMenu
     * ---------------
     * Closes the mobile menu if it is currently open.
     * Called after a nav link is clicked (mobile UX).
     */
    function closeMobileMenu() {
        if (!header || !menuBtn) return;

        // Remove .nav-open class if present
        if (header.classList.contains('nav-open')) {
            header.classList.remove('nav-open');
            menuBtn.setAttribute('aria-expanded', 'false');

            // TODO: Re-enable body scroll if it was disabled
            // document.body.style.overflow = '';
        }
    }

    // Attach click event to hamburger toggle button
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when any nav link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    /*
      ------------------------------------------------------------------
      3. ACTIVE NAV LINK HIGHLIGHTING (IntersectionObserver)
      ------------------------------------------------------------------
      - Uses the IntersectionObserver API to detect which section
        is currently visible in the viewport.
      - Adds aria-current="page" to the corresponding nav link.
      - Falls back to scroll-based detection if IntersectionObserver
        is not supported (older browsers).
      ------------------------------------------------------------------
    */

    /**
     * updateActiveNav
     * ---------------
     * Removes aria-current from all nav links, then sets it on
     * the link whose href matches the given section id.
     *
     * @param {string} sectionId - The id of the current section
     *   (e.g., "about", "projects").
     */
    function updateActiveNav(sectionId) {
        // Remove active state from all nav links
        navLinks.forEach(link => {
            link.removeAttribute('aria-current');
        });

        // Find the nav link that matches the current section id
        const activeLink = document.querySelector(
            `.nav-link[href="#${sectionId}"]`
        );

        if (activeLink) {
            activeLink.setAttribute('aria-current', 'page');
        }

        // TODO: Update document title based on active section?
        // document.title = `Section Name - Everton Smith`;
    }

    /**
     * setupIntersectionObserver
     * -------------------------
     * Creates an IntersectionObserver that watches each section.
     * When a section enters the viewport, updateActiveNav is called
     * with that section's id.
     *
     * threshold: 0.3 means the section is considered "visible"
     * when 30% of it is in the viewport.
     *
     * rootMargin: Accounts for the fixed header height so the
     * observer doesn't trigger too early.
     */
    function setupIntersectionObserver() {
        // Return early if IntersectionObserver is not supported
        // (e.g., very old browsers)
        if (!('IntersectionObserver' in window)) {
            // TODO: Fall back to scroll-based detection
            // setupScrollBasedDetection();
            return;
        }

        const observerOptions = {
            root: null,       // Use the viewport as the root
            rootMargin: `-${getComputedStyle(document.documentElement)
                .getPropertyValue('--header-height')
                .trim() || '64px'} 0px 0px 0px`,  // Offset for fixed header
            threshold: 0.3    // Trigger when 30% of the section is visible
        };

        /**
         * observerCallback
         * ----------------
         * IntersectionObserver callback. Iterates over observed
         * entries and updates the active nav link when a section
         * enters the viewport.
         *
         * @param {IntersectionObserverEntry[]} entries
         */
        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                // Only update when the section is intersecting (visible)
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');
                    if (sectionId) {
                        updateActiveNav(sectionId);
                    }
                }
            });
        };

        // Create the observer and start observing each section
        const observer = new IntersectionObserver(
            observerCallback,
            observerOptions
        );

        sections.forEach((section) => {
            observer.observe(section);
        });
    }

    // Initialize the IntersectionObserver
    setupIntersectionObserver();

    /*
      ------------------------------------------------------------------
      4. SMOOTH SCROLL (RESPECT REDUCED MOTION)
      ------------------------------------------------------------------
      - CSS scroll-behavior: smooth handles most cases.
      - This JS fallback is for browsers that don't support
        CSS scroll-behavior, or for programmatic scrolling needs.
      - Requires the user's OS to not prefer reduced motion.
      ------------------------------------------------------------------
    */

    /**
     * smoothScrollTo
     * --------------
     * Programmatically scrolls to a target element with animation.
     * Uses requestAnimationFrame for smooth performance.
     * Respects prefers-reduced-motion.
     *
     * @param {HTMLElement} targetEl - The element to scroll to.
     * @param {number}      offset   - Additional offset (px) from top,
     *   typically the header height.
     */
    function smoothScrollTo(targetEl, offset = 64) {
        // Do not animate if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (prefersReducedMotion) {
            // Instant scroll without animation
            window.scrollTo({
                top: targetEl.offsetTop - offset,
                behavior: 'auto'
            });
            return;
        }

        // TODO: Implement custom smooth scroll with requestAnimationFrame
        // For now, fall back to native smooth scroll behavior
        window.scrollTo({
            top: targetEl.offsetTop - offset,
            behavior: 'smooth'
        });
    }

    // TODO: Attach smoothScrollTo to any custom scroll buttons
    // Example: document.querySelector('.scroll-down-btn')
    //   .addEventListener('click', () => smoothScrollTo(targetSection));

    /*
      ------------------------------------------------------------------
      5. DYNAMIC YEAR IN FOOTER COPYRIGHT
      ------------------------------------------------------------------
      - Sets the #current-year span to the current year automatically.
      - Ensures the copyright notice is always up to date.
      ------------------------------------------------------------------
    */

    /**
     * setCopyrightYear
     * ----------------
     * Finds the span with id="current-year" and sets its text content
     * to the current year (e.g., "2026").
     */
    function setCopyrightYear() {
        if (!yearSpan) {
            // TODO: Handle missing element - add fallback logic
            console.warn('Element #current-year not found in the DOM.');
            return;
        }

        // Get the current year from a new Date instance
        const currentYear = new Date().getFullYear();

        // Set the span text to the year string
        yearSpan.textContent = currentYear;
    }

    // Execute the copyright year update
    setCopyrightYear();

    /*
      ------------------------------------------------------------------
      6. KEYBOARD ACCESSIBILITY (CLOSE MENU ON ESC)
      ------------------------------------------------------------------
      - Pressing the Escape key while the mobile menu is open
        will close it. This is a standard accessibility pattern.
      ------------------------------------------------------------------
    */

    /**
     * handleEscapeKey
     * ---------------
     * Listens for keydown events. If the Escape key is pressed
     * and the mobile menu is open, close it.
     *
     * @param {KeyboardEvent} event
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
            closeMobileMenu();
        }
    }

    // Attach the escape key listener to the document
    document.addEventListener('keydown', handleEscapeKey);

    /*
      ------------------------------------------------------------------
      7. CONSOLE LOG (DEV / DEBUG INFO)
      ------------------------------------------------------------------
      - Optional: Logs a message to the browser console for
        development/debugging purposes.
      - Remove or comment out for production.
      ------------------------------------------------------------------
    */
    console.log(
        '%c Everton Website v2 ',
        'background: #6db34d; color: #2F323A; font-weight: bold; padding: 4px 8px;'
    );
    console.log('Navigation links:', navLinks.length);
    console.log('Sections observed:', sections.length);

    /*
      ------------------------------------------------------------------
      8. TODO: ADDITIONAL FUNCTIONALITY
      ------------------------------------------------------------------
      - Placeholder for future enhancements.
      ------------------------------------------------------------------
    */

    // TODO: Add dark mode toggle
    // function toggleTheme() { ... }

    // TODO: Add scroll-to-top button visibility (show after scrolling down)
    // function handleScrollToTopVisibility() { ... }

    // TODO: Add project filter/category buttons
    // function filterProjects(category) { ... }

    // TODO: Add lazy loading for images (handled by native loading="lazy")
    // but could add intersection observer fallback for old browsers.

}); // End of DOMContentLoaded