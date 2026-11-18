document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('main-container');
    const optionLabels = ['Contact', 'Resume', 'About', 'Projects'];

    /**
     * Rebuilds the original option divs inside the main container
     * and re-attaches click listeners to each one.
     */
    function restoreOptions() {
        mainContainer.innerHTML = optionLabels
            .map(label => `<div class="option">${label}</div>`)
            .join('');
        attachOptionListeners();
    }

    function attachOptionListeners() {
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => handleOptionSelect(option));
        });
    }

    /**
     * Runs the transition sequence when an option is selected:
     * 1. Every other option falls down one at a time (sequential delays)
     * 2. The selected option expands and dissolves
     * 3. A new .container div (id matching the option text) fades in
     *    with a back button that restores the original options
     */
    function handleOptionSelect(selected) {
        const optionText = selected.textContent.trim();
        const options = Array.from(document.querySelectorAll('.option'));
        const fallDelay = 120; // ms between each option falling

        // 1. Other options fall down one at a time
        options.forEach((option, index) => {
            if (option !== selected) {
                setTimeout(() => {
                    option.classList.add('fall-down');
                }, index * fallDelay);
            }
        });

        // 2. Selected option expands and dissolves after the others have fallen
        setTimeout(() => {
            selected.classList.add('expand-dissolve');
        }, options.length * fallDelay);

        // 3. Once animations finish, replace options with the new container div
        setTimeout(() => {
            options.forEach(option => option.remove());

            const newContainer = document.createElement('div');
            newContainer.className = 'container';
            newContainer.id = optionText;

            newContainer.innerHTML = `
                <h1>${optionText}</h1>
                <p>Welcome to the ${optionText} section.</p>
                <button class="back-btn">Back</button>
            `;

            mainContainer.appendChild(newContainer);

            // Trigger the fade-in animation
            requestAnimationFrame(() => {
                newContainer.classList.add('container-fade-in');
            });

            // Back button: removes this container and restores original options
            const backBtn = newContainer.querySelector('.back-btn');
            backBtn.addEventListener('click', () => {
                newContainer.style.transition = 'opacity 0.5s ease';
                newContainer.style.opacity = '0';
                setTimeout(() => {
                    newContainer.remove();
                    restoreOptions();
                }, 500);
            });
        }, options.length * fallDelay + 1000);
    }

    // Initialise
    restoreOptions();
});