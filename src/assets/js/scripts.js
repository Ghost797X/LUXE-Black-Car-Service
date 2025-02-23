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
    const carQuantityInput = document.getElementById('carQuantity');
    const carQuantityDisplay = document.getElementById('carQuantityDisplay');
    let distanceMiles = 0;

    async function getCoordinates(address) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        return data[0] ? { lat: data[0].lat, lon: data[0].lon } : null;
    }

    async function calculatePrice() {
        const cars = parseInt(carQuantityInput.value);
        const ratePerMile = 2.50;
        const basePrice = 20.00;

        try {
            const pickup = await getCoordinates(pickupInput.value);
            const dropoff = await getCoordinates(dropoffInput.value);
            
            if (pickup && dropoff) {
                const routeResponse = await fetch(
                    `http://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${dropoff.lon},${dropoff.lat}?overview=false`
                );
                const routeData = await routeResponse.json();
                
                if (routeData.routes.length > 0) {
                    distanceMiles = routeData.routes[0].distance / 1609.34;
                    const total = (basePrice + (distanceMiles * ratePerMile) * cars).toFixed(2);
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

    document.getElementById('decreaseCarQuantity').addEventListener('click', () => {
        let current = parseInt(carQuantityInput.value);
        if (current > 1) {
            carQuantityInput.value = --current;
            carQuantityDisplay.textContent = current;
            calculatePrice();
        }
    });

    document.getElementById('increaseCarQuantity').addEventListener('click', () => {
        let current = parseInt(carQuantityInput.value);
        if (current < 3) {
            carQuantityInput.value = ++current;
            carQuantityDisplay.textContent = current;
            calculatePrice();
        }
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Booking confirmed! We will send confirmation details via email.');
    });

    // Initial calculation
    calculatePrice();
});