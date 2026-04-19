/**
 * Luxury Hotel Tirana — Main JavaScript
 * Uses jQuery, AJAX, DOM Manipulation, Bootstrap 5
 */

$(document).ready(function () {

    // ==================== GLOBAL DATA ====================
    let hotelData = null;
    let selectedTableId = null;
    let currentFeedbackRating = 0;

    // ==================== LOADING SCREEN ====================
    $(window).on('load', function () {
        setTimeout(function () {
            $('#loading-screen').addClass('hidden');
        }, 1200);
    });

    // Fallback: hide loader after 3 seconds
    setTimeout(function () {
        $('#loading-screen').addClass('hidden');
    }, 3000);

    // ==================== LOAD DATA VIA AJAX ====================
    $.ajax({
        url: 'data.json',
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            hotelData = data;
            initializeWebsite(data);
        },
        error: function () {
            console.warn('Could not load data.json, using inline fallback.');
        }
    });

    /**
     * Initialize all sections after data is loaded
     */
    function initializeWebsite(data) {
        renderAboutSection(data);
        renderRooms(data.rooms);
        renderPricingSection(data);
        renderServices(data.services);
        renderBookingExtras(data.pricing.extras);
        renderRestaurant(data.restaurant);
        renderTestimonials(data.testimonials);
        renderContactInfo(data.hotel);
        populateRoomSelects(data.rooms);
        setMinDates();
    }

    // ==================== STICKY NAVBAR ====================
    $(window).on('scroll', function () {
        var scrollTop = $(this).scrollTop();

        // Navbar scroll effect
        if (scrollTop > 80) {
            $('#mainNav').addClass('scrolled');
        } else {
            $('#mainNav').removeClass('scrolled');
        }

        // Back to top button
        if (scrollTop > 400) {
            $('#backToTop').addClass('visible');
        } else {
            $('#backToTop').removeClass('visible');
        }

        // Active nav link based on scroll position
        updateActiveNavLink();

        // Scroll animations
        triggerScrollAnimations();
    });

    /**
     * Update active navigation link based on scroll position
     */
    function updateActiveNavLink() {
        var scrollPos = $(window).scrollTop() + 100;
        $('section[id]').each(function () {
            var top = $(this).offset().top;
            var bottom = top + $(this).outerHeight();
            var id = $(this).attr('id');
            if (scrollPos >= top && scrollPos < bottom) {
                $('.nav-link').removeClass('active');
                $('.nav-link[href="#' + id + '"]').addClass('active');
            }
        });
    }

    // ==================== BACK TO TOP ====================
    $('#backToTop').on('click', function () {
        $('html, body').animate({ scrollTop: 0 }, 600);
    });

    // ==================== SCROLL ANIMATIONS ====================
    function triggerScrollAnimations() {
        $('.scroll-animate').each(function () {
            var elementTop = $(this).offset().top;
            var viewBottom = $(window).scrollTop() + $(window).height() - 80;
            if (elementTop < viewBottom) {
                $(this).addClass('visible');
            }
        });
    }

    // ==================== SMOOTH NAV CLOSE ON MOBILE ====================
    $('.nav-link').on('click', function () {
        var navCollapse = $('#navMenu');
        if (navCollapse.hasClass('show')) {
            navCollapse.collapse('hide');
        }
    });

    // ==================== ABOUT SECTION ====================
    function renderAboutSection(data) {
        // Update description
        $('#aboutDescription').text(data.hotel.description);

        // Render amenities
        var html = '';
        data.amenities.forEach(function (amenity) {
            html += '<div class="col-4 col-sm-3">' +
                '<div class="amenity-item scroll-animate">' +
                '<i class="' + amenity.icon + '"></i>' +
                '<span>' + amenity.name + '</span>' +
                '</div></div>';
        });
        $('#amenitiesGrid').html(html);
    }

    // ==================== ROOMS SECTION ====================
    function renderRooms(rooms) {
        var html = '';
        rooms.forEach(function (room) {
            html += '<div class="col-md-6 col-lg-4 room-item scroll-animate" ' +
                'data-type="' + room.type + '" ' +
                'data-price="' + room.price + '" ' +
                'data-capacity="' + room.capacity + '">' +
                '<div class="room-card">' +
                '<div class="room-card-img">' +
                '<img src="' + room.image + '" alt="' + room.name + '">' +
                '<span class="room-card-badge"><i class="fas fa-user me-1"></i>' + room.capacity + ' Guest' + (room.capacity > 1 ? 's' : '') + '</span>' +
                '</div>' +
                '<div class="room-card-body">' +
                '<h5>' + room.name + '</h5>' +
                '<p>' + room.description.substring(0, 100) + '...</p>' +
                '<div class="room-price">€' + room.price + ' <small>/ night</small></div>' +
                '</div>' +
                '<div class="room-card-footer">' +
                '<button class="btn btn-outline-gold btn-details" data-room-id="' + room.id + '"><i class="fas fa-eye me-1"></i>Details</button>' +
                '<a href="#checkin" class="btn btn-gold"><i class="fas fa-calendar-check me-1"></i>Book</a>' +
                '</div></div></div>';
        });
        $('#roomsGrid').html(html);
    }

    // Room detail modal
    $(document).on('click', '.btn-details', function () {
        var roomId = $(this).data('room-id');
        if (!hotelData) return;

        var room = hotelData.rooms.find(function (r) { return r.id === roomId; });
        if (!room) return;

        $('#roomModalTitle').text(room.name);
        $('#roomModalImage').attr('src', room.image).attr('alt', room.name);
        $('#roomModalDesc').text(room.description);
        $('#roomModalPrice').text(room.price);

        var featuresHtml = '';
        room.features.forEach(function (f) {
            featuresHtml += '<li><i class="fas fa-check-circle"></i>' + f + '</li>';
        });
        $('#roomModalFeatures').html(featuresHtml);

        var modal = new bootstrap.Modal(document.getElementById('roomModal'));
        modal.show();
    });

    // ==================== ROOM FILTERS ====================
    $('#filterType, #filterCapacity').on('change', applyRoomFilters);
    $('#filterPrice').on('input', function () {
        $('#priceDisplay').text('€' + $(this).val());
        applyRoomFilters();
    });

    $('#resetFilters').on('click', function () {
        $('#filterType').val('all');
        $('#filterPrice').val(1500);
        $('#priceDisplay').text('€1500');
        $('#filterCapacity').val('all');
        applyRoomFilters();
    });

    function applyRoomFilters() {
        var type = $('#filterType').val();
        var maxPrice = parseInt($('#filterPrice').val());
        var capacity = $('#filterCapacity').val();
        var visibleCount = 0;

        $('.room-item').each(function () {
            var itemType = $(this).data('type');
            var itemPrice = parseInt($(this).data('price'));
            var itemCapacity = String($(this).data('capacity'));

            var show = true;
            if (type !== 'all' && itemType !== type) show = false;
            if (itemPrice > maxPrice) show = false;
            if (capacity !== 'all' && itemCapacity !== capacity) show = false;

            if (show) {
                $(this).fadeIn(300);
                visibleCount++;
            } else {
                $(this).fadeOut(300);
            }
        });

        if (visibleCount === 0) {
            $('#noRoomsMsg').removeClass('d-none');
        } else {
            $('#noRoomsMsg').addClass('d-none');
        }
    }

    // ==================== PRICING CALENDAR ====================
    function renderPricingSection(data) {
        // Base prices list
        var basePricesHtml = '';
        data.rooms.forEach(function (room) {
            basePricesHtml += '<div class="base-price-item">' +
                '<span>' + room.name + '</span>' +
                '<span>€' + room.price + '</span></div>';
        });
        $('#basePricesList').html(basePricesHtml);

        // Room select in calculator
        var roomOpts = '<option value="">Select Room</option>';
        data.rooms.forEach(function (room) {
            roomOpts += '<option value="' + room.id + '">' + room.name + ' (€' + room.price + '/night)</option>';
        });
        $('#calcRoom').html(roomOpts);

        // Extras checkboxes
        var extrasHtml = '';
        data.pricing.extras.forEach(function (extra) {
            extrasHtml += '<div class="form-check">' +
                '<input class="form-check-input calc-extra" type="checkbox" value="' + extra.id + '" ' +
                'data-price="' + extra.price + '" id="calc_' + extra.id + '">' +
                '<label class="form-check-label" for="calc_' + extra.id + '">' +
                extra.name + ' (+€' + extra.price + '/night)</label></div>';
        });
        $('#calcExtras').html(extrasHtml);
    }

    /**
     * Determine the pricing season for a given date
     */
    function getSeasonType(date) {
        var d = new Date(date);
        var month = d.getMonth(); // 0-based
        var day = d.getDay(); // 0 = Sunday, 6 = Saturday

        // Holiday dates in MM-DD format (simplified international holidays:
        // Christmas Eve/Day, New Year's Eve/Day, Jan 2nd, US Thanksgiving-ish Nov 28-29)
        var mmdd = String(month + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var holidays = ['12-24', '12-25', '12-31', '01-01', '01-02', '11-28', '11-29'];
        if (holidays.indexOf(mmdd) !== -1) return 'holiday';

        // Summer season: June, July, August
        if (month >= 5 && month <= 7) return 'summer';

        // Weekend: Saturday & Sunday
        if (day === 0 || day === 6) return 'weekend';

        return 'normal';
    }

    // Price calculator
    $('#calculateBtn').on('click', function () {
        var checkin = $('#calcCheckin').val();
        var checkout = $('#calcCheckout').val();
        var roomId = parseInt($('#calcRoom').val());

        if (!checkin || !checkout || !roomId) {
            showNotification('Please fill in all required fields.');
            return;
        }

        var checkinDate = new Date(checkin);
        var checkoutDate = new Date(checkout);

        if (checkoutDate <= checkinDate) {
            showNotification('Check-out date must be after check-in date.');
            return;
        }

        var room = hotelData.rooms.find(function (r) { return r.id === roomId; });
        if (!room) return;

        var nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        var baseTotal = 0;
        var seasonInfo = [];

        // Calculate price per night based on season
        var currentDate = new Date(checkinDate);
        for (var i = 0; i < nights; i++) {
            var season = getSeasonType(currentDate);
            var multiplier = hotelData.pricing.seasons[season].multiplier;
            baseTotal += room.price * multiplier;
            seasonInfo.push(season);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Extra services
        var extrasTotal = 0;
        var extrasPerNight = 0;
        $('.calc-extra:checked').each(function () {
            extrasPerNight += parseFloat($(this).data('price'));
        });
        extrasTotal = extrasPerNight * nights;

        var subtotal = baseTotal + extrasTotal;
        var tax = subtotal * hotelData.pricing.taxRate;
        var total = subtotal + tax;
        var seasonAdjustment = baseTotal - (room.price * nights);

        // Show summary
        $('#priceSummary').removeClass('d-none');
        $('#sumNights').text(nights + ' night' + (nights > 1 ? 's' : ''));
        $('#sumBase').text('€' + (room.price * nights).toFixed(2));
        $('#sumSeason').text((seasonAdjustment >= 0 ? '+' : '') + '€' + seasonAdjustment.toFixed(2));
        $('#sumExtras').text('€' + extrasTotal.toFixed(2));
        $('#sumTax').text('€' + tax.toFixed(2));
        $('#sumTotal').text('€' + total.toFixed(2));
    });

    // ==================== SERVICES SECTION ====================
    function renderServices(services) {
        var html = '';
        services.forEach(function (service) {
            html += '<div class="col-md-6 col-lg-3">' +
                '<div class="service-card scroll-animate">' +
                '<div class="service-icon"><i class="' + service.icon + '"></i></div>' +
                '<h5>' + service.name + '</h5>' +
                '<p>' + service.description + '</p>' +
                '</div></div>';
        });
        $('#servicesGrid').html(html);
    }

    // ==================== BOOKING FORM ====================
    function renderBookingExtras(extras) {
        var html = '';
        extras.forEach(function (extra) {
            html += '<div class="col-sm-6 col-md-4">' +
                '<div class="form-check">' +
                '<input class="form-check-input book-extra" type="checkbox" value="' + extra.id + '" id="book_' + extra.id + '">' +
                '<label class="form-check-label" for="book_' + extra.id + '">' +
                extra.name + ' (+€' + extra.price + ')</label></div></div>';
        });
        $('#bookExtras').html(html);
    }

    function populateRoomSelects(rooms) {
        var opts = '<option value="">Select Room</option>';
        rooms.forEach(function (room) {
            opts += '<option value="' + room.type + '">' + room.name + ' — from €' + room.price + '</option>';
        });
        $('#bookRoom').html(opts);
    }

    function setMinDates() {
        var today = new Date().toISOString().split('T')[0];
        $('#bookCheckin, #calcCheckin, #tableDate').attr('min', today);
        $('#bookCheckout, #calcCheckout').attr('min', today);
    }

    // Booking form submission
    $('#bookingForm').on('submit', function (e) {
        e.preventDefault();

        // Validate required fields
        var form = this;
        if (!form.checkValidity()) {
            $(form).addClass('was-validated');
            return;
        }

        var name = $('#bookName').val();
        var email = $('#bookEmail').val();
        var roomType = $('#bookRoom option:selected').text();
        var checkin = $('#bookCheckin').val();
        var checkout = $('#bookCheckout').val();

        // Validate dates
        if (new Date(checkout) <= new Date(checkin)) {
            showNotification('Check-out must be after check-in date.');
            return;
        }

        // Simulate AJAX submission
        var bookingData = {
            name: name,
            email: email,
            phone: $('#bookPhone').val(),
            room: roomType,
            guests: $('#bookGuests').val(),
            checkin: checkin,
            checkout: checkout,
            extras: [],
            requests: $('#bookRequests').val()
        };

        $('.book-extra:checked').each(function () {
            bookingData.extras.push($(this).val());
        });

        // Simulate AJAX request
        $.ajax({
            url: 'data.json',
            method: 'GET',
            dataType: 'json',
            beforeSend: function () {
                showNotification('Processing your reservation...');
            },
            success: function () {
                // Show success modal
                $('#confirmedName').text(name);
                $('#confirmedRoom').text(roomType);
                $('#confirmedDates').text(checkin + ' to ' + checkout);
                $('#confirmedEmail').text(email);

                var modal = new bootstrap.Modal(document.getElementById('bookingSuccessModal'));
                modal.show();

                // Reset form
                $('#bookingForm')[0].reset();
                $('#bookingForm').removeClass('was-validated');

                // Show fake email notification
                setTimeout(function () {
                    showNotification('Confirmation email sent to ' + email);
                }, 2000);
            }
        });
    });

    // ==================== RESTAURANT SECTION ====================
    function renderRestaurant(restaurant) {
        // Render tables
        var tablesHtml = '';
        restaurant.tables.forEach(function (table) {
            var statusClass = table.status;
            var icon = table.status === 'reserved' ? 'fa-lock' : 'fa-chair';
            tablesHtml += '<div class="table-item ' + statusClass + '" data-table-id="' + table.id + '" ' +
                'data-seats="' + table.seats + '" data-status="' + table.status + '">' +
                '<i class="fas ' + icon + ' table-icon"></i>' +
                '<div class="table-number">T' + table.id + '</div>' +
                '<div class="table-seats"><i class="fas fa-user me-1"></i>' + table.seats + ' seats</div>' +
                '<div class="table-position">' + table.position + '</div>' +
                '</div>';
        });
        $('#tableLayout').html(tablesHtml);

        // Time slots
        var timeOpts = '<option value="">Select Time</option>';
        restaurant.timeSlots.forEach(function (slot) {
            timeOpts += '<option value="' + slot + '">' + slot + '</option>';
        });
        $('#tableTime').html(timeOpts);
    }

    // Table selection
    $(document).on('click', '.table-item', function () {
        if ($(this).hasClass('reserved')) return;

        // Deselect previous — restore 'available' class which was removed during selection
        $('.table-item.selected').removeClass('selected').addClass('available');

        // Select this one
        $(this).removeClass('available').addClass('selected');
        selectedTableId = $(this).data('table-id');
        var seats = $(this).data('seats');
        var position = $(this).find('.table-position').text();
        $('#selectedTableDisplay').val('Table ' + selectedTableId + ' (' + seats + ' seats, ' + position + ')');
    });

    // Table reservation form
    $('#tableForm').on('submit', function (e) {
        e.preventDefault();

        var date = $('#tableDate').val();
        var time = $('#tableTime').val();
        var guests = $('#tableGuests').val();

        if (!date || !time || !guests || !selectedTableId) {
            showNotification('Please fill all fields and select a table.');
            return;
        }

        // Simulate AJAX
        $.ajax({
            url: 'data.json',
            method: 'GET',
            dataType: 'json',
            success: function () {
                // Mark table as reserved
                var tableEl = $('.table-item[data-table-id="' + selectedTableId + '"]');
                tableEl.removeClass('selected available').addClass('reserved');
                tableEl.data('status', 'reserved');
                tableEl.find('.table-icon').removeClass('fa-chair').addClass('fa-lock');

                // Show success modal — escape user inputs before inserting as HTML
                $('#tableConfirmDetails').html(
                    '<i class="fas fa-calendar me-1"></i>' + escapeHtml(date) +
                    ' at ' + escapeHtml(time) +
                    '<br><i class="fas fa-users me-1"></i>' + escapeHtml(guests) + ' guests' +
                    '<br><i class="fas fa-chair me-1"></i>Table ' + escapeHtml(String(selectedTableId))
                );

                var modal = new bootstrap.Modal(document.getElementById('tableSuccessModal'));
                modal.show();

                // Reset
                $('#tableForm')[0].reset();
                $('#selectedTableDisplay').val('');
                selectedTableId = null;

                showNotification('Table reservation confirmed!');
            }
        });
    });

    // ==================== FEEDBACK / TESTIMONIALS ====================
    function renderTestimonials(testimonials) {
        var html = '';
        testimonials.forEach(function (t, i) {
            var stars = '';
            for (var s = 0; s < 5; s++) {
                stars += s < t.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
            }
            html += '<div class="carousel-item' + (i === 0 ? ' active' : '') + '">' +
                '<div class="testimonial-card">' +
                '<div class="stars">' + stars + '</div>' +
                '<p class="comment">"' + t.comment + '"</p>' +
                '<img src="' + t.avatar + '" alt="' + t.name + '" class="author-img">' +
                '<div class="author-name">' + t.name + '</div>' +
                '<div class="author-date">' + t.date + '</div>' +
                '</div></div>';
        });
        $('#testimonialSlides').html(html);
    }

    // Star rating interaction
    $('#starRating i').on('click', function () {
        currentFeedbackRating = $(this).data('rating');
        $('#fbRating').val(currentFeedbackRating);
        $('#starRating i').each(function () {
            if ($(this).data('rating') <= currentFeedbackRating) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
    });

    // Hover effect on stars
    $('#starRating i').on('mouseenter', function () {
        var hoverRating = $(this).data('rating');
        $('#starRating i').each(function () {
            if ($(this).data('rating') <= hoverRating) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
    });

    $('#starRating').on('mouseleave', function () {
        $('#starRating i').each(function () {
            if ($(this).data('rating') <= currentFeedbackRating) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
    });

    // Feedback form submission
    $('#feedbackForm').on('submit', function (e) {
        e.preventDefault();

        var name = $('#fbName').val().trim();
        var comment = $('#fbComment').val().trim();
        var rating = parseInt($('#fbRating').val());

        if (!name || !comment || rating === 0) {
            showNotification('Please fill all fields and select a rating.');
            return;
        }

        // Create stars HTML
        var starsHtml = '';
        for (var s = 0; s < 5; s++) {
            starsHtml += s < rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        }

        // Add feedback card to DOM dynamically
        var feedbackCard = '<div class="col-md-6 col-lg-4">' +
            '<div class="user-feedback-card">' +
            '<div class="uf-stars">' + starsHtml + '</div>' +
            '<div class="uf-name mt-2">' + escapeHtml(name) + '</div>' +
            '<div class="uf-comment">"' + escapeHtml(comment) + '"</div>' +
            '<small class="text-muted">Just now</small>' +
            '</div></div>';

        $('#feedbackGrid').prepend(feedbackCard);

        // Reset form
        $('#feedbackForm')[0].reset();
        currentFeedbackRating = 0;
        $('#fbRating').val(0);
        $('#starRating i').removeClass('active');

        showNotification('Thank you for your feedback!');
    });

    // ==================== CONTACT SECTION ====================
    function renderContactInfo(hotel) {
        $('#contactAddress').text(hotel.address);
        $('#contactPhone').text(hotel.phone);
        $('#contactEmail').text(hotel.email);
        $('#contactHours').text(hotel.hours);
    }

    // Contact form
    $('#contactForm').on('submit', function (e) {
        e.preventDefault();

        var name = $('#ctName').val().trim();
        var email = $('#ctEmail').val().trim();
        var subject = $('#ctSubject').val().trim();
        var message = $('#ctMessage').val().trim();

        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields.');
            return;
        }

        var statusEl = $('#contactStatus');
        var btn = $('#contactSubmitBtn');

        // Show sending status
        statusEl.removeClass('d-none sent').addClass('sending');
        statusEl.html('<i class="fas fa-spinner fa-spin me-2"></i>Sending...');
        btn.prop('disabled', true);

        // Simulate AJAX request
        $.ajax({
            url: 'data.json',
            method: 'GET',
            dataType: 'json',
            success: function () {
                setTimeout(function () {
                    // Show sent status
                    statusEl.removeClass('sending').addClass('sent');
                    statusEl.html('<i class="fas fa-check-circle me-2"></i>Message sent successfully!');
                    btn.prop('disabled', false);

                    // Reset form
                    $('#contactForm')[0].reset();

                    // Show notification
                    showNotification('Your message has been sent. We\'ll reply to ' + email + ' shortly.');

                    // Hide status after 5s
                    setTimeout(function () {
                        statusEl.addClass('d-none');
                    }, 5000);
                }, 1500);
            }
        });
    });

    // ==================== NEWSLETTER ====================
    $('#newsletterForm').on('submit', function (e) {
        e.preventDefault();
        var email = $('#newsletterEmail').val().trim();
        if (!email) return;

        $('#newsletterStatus').html('<span class="text-gold small"><i class="fas fa-check me-1"></i>Subscribed successfully!</span>');
        $('#newsletterEmail').val('');

        showNotification('You\'ve been subscribed to our newsletter!');

        setTimeout(function () {
            $('#newsletterStatus').html('');
        }, 4000);
    });

    // ==================== NOTIFICATION POPUP ====================
    function showNotification(text) {
        var el = $('#emailNotification');
        $('#notificationText').text(text);
        el.removeClass('d-none');

        setTimeout(function () {
            el.addClass('d-none');
        }, 4000);
    }

    // ==================== UTILITY FUNCTIONS ====================
    /**
     * Escape HTML to prevent XSS in user-submitted content
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // ==================== INITIAL SCROLL ANIMATION TRIGGER ====================
    setTimeout(function () {
        triggerScrollAnimations();
    }, 500);

});
