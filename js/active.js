(function ($) {
    'use strict';

    // [ JS Active Code Index ]

    // :: 1.0 Owl Carousel Active Code
    // :: 2.0 Slick Active Code
    // :: 3.0 Footer Reveal Active Code
    // :: 4.0 ScrollUp Active Code
    // :: 5.0 CounterUp Active Code
    // :: 6.0 onePageNav Active Code
    // :: 7.0 Magnific-popup Video Active Code
    // :: 8.0 Sticky Active Code
    // :: 9.0 Preloader Active code

    // :: 1.0 Owl Carousel Active Code
    if ($.fn.owlCarousel) {
        $(".welcome_slides").owlCarousel({
            items: 1,
            loop: true,
            autoplay: true,
            smartSpeed: 1500,
            nav: true,
            navText: ["<i class='pe-7s-angle-left'</i>", "<i class='pe-7s-angle-right'</i>"]
        });
        $(".app_screenshots_slides").owlCarousel({
            items: 1,
            loop: true,
            autoplay:true,
            autoplayTimeout: 2000,
            autoplaySpeed: 1000,
            autoplayHoverPause:false,
            smartSpeed: 300,
            margin: 30,
            center: true,
            dots: false,
            responsive: {
                0: {
                    items: 1
                },
                480: {
                    items: 3
                },
                992: {
                    items: 5
                }
            }
        });

        $(".testimonials-slider").owlCarousel({
            items: 1,
            loop: true,
            autoplay:true,
            autoplayTimeout: 3000,
            autoplaySpeed: 2000,
            autoplayHoverPause:true,
            nav: true
        });
    }

    // :: 2.0 Slick Active Code
    if ($.fn.slick) {
        $('.slider-for').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            speed: 500,
            arrows: false,
            fade: true,
            asNavFor: '.slider-nav'
        });
        $('.slider-nav').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            speed: 500,
            asNavFor: '.slider-for',
            dots: true,
            centerMode: true,
            focusOnSelect: true,
            slide: 'div',
            autoplay: true,
            centerMode: true,
            centerPadding: '30px',
            mobileFirst: true,
            prevArrow: '<i class="fa fa-angle-left"></i>',
            nextArrow: '<i class="fa fa-angle-right"></i>'
        });
    }

    // :: 3.0 Footer Reveal Active Code
    if ($.fn.footerReveal) {
        $('footer').footerReveal({
            shadow: true,
            shadowOpacity: 0.3,
            zIndex: -101
        });
    }

    // :: 4.0 ScrollUp Active Code
    if ($.fn.scrollUp) {
        $.scrollUp({
            scrollSpeed: 1500,
            scrollText: '<i class="fa fa-angle-up"></i>'
        });
    }

    // :: 5.0 CounterUp Active Code
    if ($.fn.counterUp) {
        $('.counter').counterUp({
            delay: 10,
            time: 2000
        });
    }

    // Read section positions on every click; filtering projects changes page height.
    $('#nav a[href^="#"], .navbar-brand[href^="#"]').on('click', function (event) {
        var target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        var $menu = $('#ca-navbar');
        if ($menu.hasClass('collapsing')) {
            $menu.one('shown.bs.collapse', function () { $menu.collapse('hide'); });
        } else {
            $menu.collapse('hide');
        }
        target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
        history.replaceState(null, '', this.getAttribute('href'));
        updateNavigation();
    });

    // :: 7.0 Magnific-popup Video Active Code
    if ($.fn.magnificPopup) {
        $('.video_btn').magnificPopup({
            disableOn: 0,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: true,
            fixedContentPos: false
        });
    }

    $('a[href="#"]').click(function ($) {
        $.preventDefault()
    });

    var $window = $(window);

    if ($window.width() > 767) {
        new WOW().init();
    }

    // :: 8.0 Sticky Active Code
    function updateNavigation() {
        var scrollTop = $window.scrollTop();
        $('.header_area').toggleClass('sticky slideInDown', scrollTop > 48);
        var activeId = 'home';
        $('#nav a[href^="#"]').each(function () {
            var section = document.querySelector(this.getAttribute('href'));
            if (section && section.getBoundingClientRect().top <= 100) activeId = section.id;
        });
        $('#nav .nav-item').removeClass('active');
        $('#nav a').removeAttr('aria-current');
        $('#nav a[href="#' + activeId + '"]').attr('aria-current', 'location').parent().addClass('active');
    }
    $window.on('scroll load resize', updateNavigation);
    updateNavigation();

    // :: 9.0 Preloader Active code
    $window.on('load', function () {
        $('#preloader').fadeOut('slow', function () {
            $(this).remove();
        });
    });

})(jQuery);
