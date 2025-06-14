        (function() {
            // State variables
            let doorType = 'small';

            // Debounce function
            function debounce(func, delay) {
                let timeout;
                return function(...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), delay);
                };
            }

            // References to DOM elements
            const feetInput = document.getElementById('feet');
            const inchesInput = document.getElementById('inches');
            const sideBoardInput = document.getElementById('sideBoard');
            const smallDoorTab = document.getElementById('smallDoorTab');
            const bigDoorTab = document.getElementById('bigDoorTab');
            const resultDiv = document.getElementById('result');
            const body = document.body;

            // Event listeners for inputs with debounce
            feetInput.addEventListener('input', debounce(calculateSpaces, 500));
            inchesInput.addEventListener('input', debounce(calculateSpaces, 500));
            sideBoardInput.addEventListener('input', debounce(calculateSpaces, 500));

            // Event listeners for door type tabs
            smallDoorTab.addEventListener('click', () => selectDoorType('small'));
            bigDoorTab.addEventListener('click', () => selectDoorType('big'));

            // Function to select door type
            function selectDoorType(type) {
                doorType = type;
                // Update tab styles
                if (type === 'small') {
                    smallDoorTab.classList.add('active');
                    bigDoorTab.classList.remove('active');
                    // Update body class for styling
                    body.classList.remove('big-door-active');
                } else {
                    smallDoorTab.classList.remove('active');
                    bigDoorTab.classList.add('active');
                    // Update body class for styling
                    body.classList.add('big-door-active');
                }
                calculateSpaces(); // Trigger calculation immediately
            }

            // Initial door type selection
            selectDoorType('small');

            // Function to parse inches input, including fractions
            function parseInches(inchesStr) {
                let totalInches = 0;
                const parts = inchesStr.split(' ').filter(Boolean);

                for (let part of parts) {
                    if (part.includes('/')) {
                        const [numerator, denominator] = part.split('/').map(Number);
                        if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
                            return NaN;
                        }
                        totalInches += numerator / denominator;
                    } else {
                        const number = parseFloat(part);
                        if (isNaN(number)) {
                            return NaN;
                        }
                        totalInches += number;
                    }
                }

                return totalInches;
            }

            // Function to calculate equal spaces
            function calculateSpaces() {
                const feetValue = feetInput.value.trim();
                const inchesValue = inchesInput.value.trim();
                const sideBoardValue = sideBoardInput.value.trim();

                // Validate inputs
                let feet = 0;
                let inches = 0;
                let sideBoardWidth = 5.5; // Default value

                if (feetValue !== '') {
                    feet = parseInt(feetValue, 10);
                    if (isNaN(feet) || feet < 0) {
                        resultDiv.innerText = 'Please enter a valid non-negative number for feet.';
                        return;
                    }
                }

                if (inchesValue !== '') {
                    inches = parseInches(inchesValue);
                    if (isNaN(inches) || inches < 0) {
                        resultDiv.innerText = 'Please enter a valid non-negative number for inches.';
                        return;
                    }
                }

                if (sideBoardValue !== '') {
                    sideBoardWidth = parseFloat(sideBoardValue);
                    if (isNaN(sideBoardWidth) || sideBoardWidth < 0) {
                        resultDiv.innerText = 'Please enter a valid non-negative number for side board width.';
                        return;
                    }
                }

                const totalWidth = (feet * 12) + inches;

                // Ensure totalWidth is positive
                if (totalWidth <= 0) {
                    resultDiv.innerText = 'Total width must be greater than zero.';
                    return;
                }

                let equalSpace;

                if (doorType === 'small') {
                    const fixedWidth = (2 * sideBoardWidth) + 11.125; // Small door setup
                    equalSpace = (totalWidth - fixedWidth) / 2;
                    if (equalSpace < 0) {
                        resultDiv.innerText = 'Total width is too small for the selected door type.';
                        return;
                    }
                } else if (doorType === 'big') {
                    const fixedWidth = (2 * sideBoardWidth) + (3 * 11.125); // Big door setup
                    equalSpace = (totalWidth - fixedWidth) / 4;
                    if (equalSpace < 0) {
                        resultDiv.innerText = 'Total width is too small for the selected door type.';
                        return;
                    }
                }

                const resultText = `Each equal space is approximately ${convertToTapeMeasurement(equalSpace)} inches.`;
                resultDiv.innerText = resultText;
            }

            // Function to convert decimal inches to tape measurement
            function convertToTapeMeasurement(decimalInches) {
                const fraction = Math.round(decimalInches * 16);
                const whole = Math.floor(fraction / 16);
                const remainder = fraction % 16;

                if (remainder === 0) return `${whole}"`;

                const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
                const divisor = gcd(remainder, 16);

                const numerator = remainder / divisor;
                const denominator = 16 / divisor;

                return `${whole ? whole + ' ' : ''}${numerator}/${denominator}"`;
            }

            // Instructions modal handling
            const modal = document.getElementById('instructionsModal');
            const showModalBtn = document.getElementById('showModalBtn');
            const closeModalBtn = document.getElementById('closeModalBtn');

            // Function to open the modal
            function openModal() {
                modal.style.display = "block";
                closeModalBtn.focus();
            }

            // Function to close the modal
            function closeModal() {
                modal.style.display = "none";
                showModalBtn.focus(); 
            }

            showModalBtn.addEventListener('click', openModal);
            closeModalBtn.addEventListener('click', closeModal);

            // Event listener to close the modal if a click is detected outside of it
            window.addEventListener('click', function(event) {
                if (event.target === modal) {
                    closeModal(); 
                }
            });

            // Initial calculation on page load
            calculateSpaces();
        })();
