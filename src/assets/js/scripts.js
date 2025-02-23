// This file contains JavaScript for interactive elements of the website.

document.addEventListener("DOMContentLoaded", function() {
    // Smooth scrolling for anchor links
    const smoothScroll = (target) => {
        document.querySelector(target).scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            smoothScroll(this.getAttribute('href'));
        });
    });

    // Button hover animations
    const buttons = document.querySelectorAll('.cta-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transition = 'background 0.3s ease';
            this.style.background = 'linear-gradient(90deg, #1A3A28, #0A0A0A)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.background = '#1A3A28';
        });
    });

    // Price Calculator Logic
    const bookingForm = document.getElementById('bookingForm');
    const pickupInput = document.getElementById('pickup');
    const dropoffInput = document.getElementById('dropoff');
    const priceDisplay = document.getElementById('price');
    let distanceMiles = 0;

    async function getCoordinates(address) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        return data[0] ? {
            lat: data[0].lat,
            lon: data[0].lon,
            display_name: data[0].display_name
        } : null;
    }

    function showAutocompleteSuggestions(inputElement, suggestions) {
        const container = inputElement.parentElement.querySelector('.autocomplete-items');
        container.innerHTML = '';
        suggestions.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.display_name;
            div.addEventListener('click', () => {
                inputElement.value = item.display_name;
                container.innerHTML = '';
                calculatePrice();
            });
            container.appendChild(div);
        });
    }

    function setupAutocomplete(inputElement) {
        let currentTimeout;
        
        inputElement.addEventListener('input', async (e) => {
            clearTimeout(currentTimeout);
            currentTimeout = setTimeout(async () => {
                if (inputElement.value.length > 2) {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us,ca&q=${encodeURIComponent(inputElement.value)}`);
                    const data = await response.json();
                    showAutocompleteSuggestions(inputElement, data.slice(0, 4));
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target)) {
                inputElement.parentElement.querySelector('.autocomplete-items').innerHTML = '';
            }
        });
    }

    // Initialize autocomplete for both address inputs
    setupAutocomplete(pickupInput);
    setupAutocomplete(dropoffInput);

    async function calculatePrice() {
        const ratePerMile = 2.50;
        const basePrice = 20.00;
        const ratePerMinute = 1.20;

        try {
            const pickup = await getCoordinates(pickupInput.value);
            const dropoff = await getCoordinates(dropoffInput.value);
            
            if (pickup && dropoff) {
                const routeResponse = await fetch(
                    `http://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}?overview=false`
                );
                const routeData = await routeResponse.json();
                
                if (routeData.routes.length > 0) {
                    const distanceMiles = routeData.routes[0].distance / 1609.34;
                    const durationMinutes = routeData.routes[0].duration / 60;
                    const total = (basePrice + (distanceMiles * ratePerMile) + (durationMinutes * ratePerMinute)).toFixed(2);
                    priceDisplay.textContent = `$${total}`;
                }
            }
        } catch (error) {
            console.error('Error calculating price:', error);
            priceDisplay.textContent = '$0.00';
            alert('Error calculating route. Please check addresses.');
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Event listeners
    const debouncedCalculatePrice = debounce(calculatePrice, 300);
    pickupInput.addEventListener('input', debouncedCalculatePrice);
    dropoffInput.addEventListener('input', debouncedCalculatePrice);


    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Booking confirmed! We will send confirmation details via email.');
    });

    // Initial calculation
    calculatePrice();
});
