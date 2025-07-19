document.addEventListener('DOMContentLoaded', function () {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form submission handler
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const product = document.getElementById('product').value;
            const address = document.getElementById('address').value;
            const notes = document.getElementById('notes').value;

            // Create WhatsApp message
            let message = `Halo, saya ingin memesan PO Dasai Mochi dengan detail berikut:\n\n`;
            message += `Nama: ${name}\n`;
            message += `No. HP: ${phone}\n`;
            message += `Produk: ${product}\n`;
            message += `Alamat: ${address}\n`;
            if (notes) {
                message += `Catatan: ${notes}\n`;
            }

            // Encode message for URL
            const encodedMessage = encodeURIComponent(message);

            // Redirect to WhatsApp
            window.location.href = `https://wa.me/6289515441332?text=${encodedMessage}`;
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
});