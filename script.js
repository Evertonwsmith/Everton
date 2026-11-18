document.addEventListener('DOMContentLoaded', () => {
    const optionsMenu = document.getElementById('options-menu');
    const mainContainer = document.getElementById('main-container');
    const fallDelay = 120; // ms between each option falling
    const fallDuration = 600; // ms - matches CSS fallDown animation

    function attachOptionListeners() {
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => handleOptionSelect(option));
        });
    }

    function attachBackListeners() {
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => handleBack(btn));
        });
    }

    function resetOptions() {
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('fall-down');
            option.style.opacity = '1';
            option.style.transition = '';
        });
    }

    /**
     * Runs the transition sequence when an option is selected:
     * 1. Every other option falls down one at a time (sequential delays)
     * 2. Selected option dissolves out
     * 3. The matching section container fades in
     */
    function handleOptionSelect(selected) {
        const targetId = selected.dataset.target;
        const options = Array.from(document.querySelectorAll('.option'));
        const targetSection = document.getElementById(targetId);

        // 1. Other options fall down one at a time
        options.forEach((option, index) => {
            if (option !== selected) {
                setTimeout(() => {
                    option.classList.add('fall-down');
                }, index * fallDelay);
            }
        });

        // Selected option dissolves out quickly
        selected.style.transition = 'opacity 0.3s ease';
        selected.style.opacity = '0';

        // 2. After falls finish, hide menu and show target section
        // fallDelay * (options.length - 1) = last fall start time, + fallDuration = last fall end time
        const showDelay = fallDelay * (options.length - 1) + fallDuration + 100;

        setTimeout(() => {
            optionsMenu.style.display = 'none';
            targetSection.classList.add('active');
            attachBackListeners();
        }, showDelay);
    }

    /**
     * Handles back button: hides current section with exit animation,
     * then brings back the options menu with a return animation.
     */
    function handleBack(btn) {
        const section = btn.closest('.section');

        // Exit animation on current section
        section.classList.remove('active');
        section.classList.add('section-exit');

        setTimeout(() => {
            section.style.display = 'none';
            section.classList.remove('section-exit');

            // Bring back options menu with return animation
            optionsMenu.style.display = 'flex';
            optionsMenu.classList.remove('menu-return');
            // Force reflow to restart animation
            void optionsMenu.offsetWidth;
            optionsMenu.classList.add('menu-return');

            resetOptions();
        }, 400);
    }

    // Initialise
    attachOptionListeners();
    attachBackListeners();
});