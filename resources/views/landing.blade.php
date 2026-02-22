<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VIMISS - Hệ thống Quản lý Du học</title>
    <meta name="description" content="VIMISS - Hệ thống quản lý du học Trung Quốc. Đăng ký tài khoản để theo dõi hồ sơ, học bổng và hành trình du học của bạn.">
    <link rel="icon" type="image/png" href="{{ asset('images/logo/logo_only.png') }}">
    <link rel="shortcut icon" href="{{ asset('images/logo/logo_only.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('images/logo/logo_only.png') }}">

    {{-- Google Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    {{-- FontAwesome --}}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <style>
        /* ============================================
           VIMISS Landing Page — White & Blue Theme
           ============================================ */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* --- CSS Variables (Design Tokens) --- */
        :root {
            /* Core Theme — VIMISS Blue */
            --vimiss-bg: #f0f6fc;
            --vimiss-surface: #ffffff;
            --vimiss-surface-raised: #f8fbff;
            --vimiss-primary: #0077B6;
            --vimiss-accent: #0077B6;
            --vimiss-text: #0a2540;
            --vimiss-muted: #8899a6;
            --vimiss-border: rgba(0,119,182,0.12);
            --vimiss-purple: #005f92;
            --vimiss-purple-vivid: #0096D6;
            --vimiss-cta-gradient: linear-gradient(135deg, #0096D6 0%, #005f92 100%);

            /* Backwards-compatible aliases */
            --clr-primary: #0077B6;
            --clr-primary-light: #38B6FF;
            --clr-primary-dark: #005f92;
            --clr-primary-vivid: #0096D6;

            --clr-accent-indigo: #0077B6;
            --clr-accent-cyan: #38B6FF;
            --clr-accent-yellow: #FEFF4F;
            --clr-accent-orange: #FF6900;
            --clr-accent-blue: #0077B6;

            /* CTA Gradient */
            --grad-cta: var(--vimiss-cta-gradient);
            --grad-cta-alt: linear-gradient(135deg, #005f92 0%, #0096D6 100%);
            --grad-purple-card: linear-gradient(208deg, rgba(0,119,182,0.08) 8%, rgba(0,150,214,0.05) 58%);

            /* Backgrounds */
            --clr-bg-hero: #f0f6fc;
            --clr-bg-dark: #005f92;
            --clr-bg-dark-card: #ffffff;
            --clr-bg-light: #ffffff;
            --clr-bg-white: #f0f6fc;
            --clr-bg-warm: #ffffff;
            --clr-bg-gray: #f0f4f8;

            /* Text */
            --clr-text-white: #FFFFFF;
            --clr-text-white-90: rgba(255,255,255,0.9);
            --clr-text-white-80: rgba(255,255,255,0.8);
            --clr-text-dark: #0a2540;
            --clr-text-body: #4a6785;
            --clr-text-muted: #8899a6;

            /* Counter Colors */
            --clr-counter-green: #16a34a;
            --clr-counter-red: #ef4444;
            --clr-counter-blue: #0077B6;
            --clr-counter-gold: #f59e0b;
            --clr-counter-indigo: #005f92;
            --clr-star: #FFAE1D;

            /* Border */
            --clr-border: rgba(0,119,182,0.12);
            --clr-border-pink: rgba(0,119,182,0.15);

            /* Fonts */
            --font-heading: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
            --font-body: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
            --font-sub: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif;
            --font-heading-alt: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif;

            /* Spacing */
            --section-pad-lg: 100px 0;
            --section-pad-md: 80px 0;
            --section-pad-sm: 60px 0;
            --container-max: 1200px;
            --radius: 8px;
            --radius-lg: 15px;
        }

        /* Selection */
        ::selection { background: #0077B6; color: #fff; text-shadow: none; }

        /* --- Reset & Base --- */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; overflow-x: hidden; }
        body {
            font: 14px/22px var(--font-body);
            color: var(--vimiss-text);
            background-color: var(--vimiss-bg);
            -webkit-font-smoothing: antialiased;
            padding-bottom: 70px;
            overflow-x: hidden;
        }
        img { max-width: 100%; height: auto; display: block; }
        a { text-decoration: none; transition: all 0.3s ease; color: var(--vimiss-accent); }
        a:hover { color: var(--clr-primary-light); }
        ul { list-style: none; }
        .container { max-width: var(--container-max); margin: 0 auto; padding: 0 20px; }

        /* --- HEADER --- */
        .site-header {
            position: fixed;
            top: 0; left: 0; right: 0;
            background: #ffffff;
            border-bottom: 1px solid var(--vimiss-border);
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(0,119,182,0.08);
        }
        .header-inner {
            max-width: var(--container-max);
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            height: 70px;
        }
        .header-logo img {
            height: 50px;
            object-fit: contain;
        }
        .header-nav {
            display: flex;
            align-items: center;
            gap: 0;
        }
        .header-nav a {
            color: var(--clr-text-dark);
            font-family: var(--font-sub);
            font-size: 15px;
            font-weight: 500;
            padding: 10px 16px;
            border-radius: var(--radius);
            opacity: 0.9;
        }
        .header-nav a:hover { opacity: 1; background: rgba(0,119,182,0.06); color: var(--vimiss-primary); }
        .auth-buttons {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .btn-login {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 20px;
            border: 2px solid var(--vimiss-primary);
            border-radius: var(--radius);
            color: var(--vimiss-primary);
            font-family: var(--font-sub);
            font-size: 14px;
            font-weight: 600;
        }
        .btn-login:hover { background: rgba(0,119,182,0.06); border-color: #005f92; color: #005f92; }
        .btn-register-header {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 20px;
            background: var(--vimiss-cta-gradient);
            border: 2px solid transparent;
            border-radius: var(--radius);
            color: var(--clr-text-white);
            font-family: var(--font-sub);
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(0,119,182,0.25);
        }
        .btn-register-header:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,119,182,0.35); }

        /* Mobile menu toggle */
        .menu-toggle {
            display: none;
            cursor: pointer;
            padding: 8px;
        }
        .menu-toggle span {
            display: block;
            width: 24px;
            height: 3px;
            background: var(--vimiss-primary);
            margin: 4px 0;
            border-radius: 2px;
            transition: 0.3s;
        }

        /* --- HERO SECTION --- */
        .hero-section {
            background: linear-gradient(135deg, #005f92 0%, #0077B6 50%, #0096D6 100%);
            padding: 160px 0 100px;
            position: relative;
            overflow: hidden;
        }
        .hero-section::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(56,182,255,0.15) 0%, transparent 70%);
            border-radius: 50%;
        }
        .hero-section::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -15%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(0,150,214,0.12) 0%, transparent 70%);
            border-radius: 50%;
        }
        .hero-content {
            text-align: center;
            position: relative;
            z-index: 2;
        }
        .hero-title {
            font-family: var(--font-heading);
            font-size: 48px;
            font-weight: 700;
            line-height: 1.2;
            color: var(--clr-text-white);
            margin-bottom: 20px;
        }
        .hero-title span { color: #38B6FF; }
        .hero-subtitle {
            font-family: var(--font-sub);
            font-size: 18px;
            font-weight: 500;
            color: var(--clr-text-white-90);
            line-height: 1.6;
            max-width: 650px;
            margin: 0 auto 30px;
        }

        /* Hero Info Cards (purple gradient) */
        .hero-info-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 40px 0 0;
        }
        .hero-info-card {
            background: var(--grad-purple-card);
            border-radius: var(--radius);
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 14px;
            transition: transform 0.3s;
        }
        .hero-info-card:hover { transform: translateY(-3px); }
        .hero-info-card-icon {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255,255,255,0.8);
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
        }
        .hero-info-card-icon img { width: 100%; height: 100%; object-fit: contain; }
        .hero-info-card-icon i {
            font-size: 24px;
            color: #ffffff;
        }
        .hero-info-card-title {
            font-family: var(--font-body);
            font-size: 13px;
            font-weight: 500;
            text-transform: uppercase;
            color: var(--vimiss-accent);
            margin-bottom: 3px;
        }
        .hero-info-card-desc {
            font-family: var(--font-body);
            font-size: 15px;
            font-weight: 500;
            color: var(--clr-text-white);
            line-height: 1.3;
        }

        /* Hero CTA */
        .hero-cta {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 40px;
            flex-wrap: wrap;
        }
        .btn-cta-primary {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 16px 36px;
            background: #ffffff;
            color: var(--vimiss-primary);
            font-family: var(--font-body);
            font-size: 16px;
            font-weight: 600;
            border-radius: var(--radius);
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .btn-cta-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.3);
            background: #f8f9fa;
            color: var(--vimiss-primary);
        }
        .btn-cta-primary:focus-visible {
            outline: 3px solid rgba(255,255,255,0.6);
            outline-offset: 3px;
        }
        .btn-cta-primary:active {
            transform: translateY(0);
        }
        .btn-cta-secondary {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 16px 36px;
            background: transparent;
            border: 2px solid rgba(255,255,255,0.9);
            color: #fff;
            font-family: var(--font-body);
            font-size: 16px;
            font-weight: 600;
            border-radius: var(--radius);
            transition: all 0.3s ease;
        }
        .btn-cta-secondary:hover { 
            background: rgba(255,255,255,0.15); 
            border-color: #fff; 
            color: #fff;
            transform: translateY(-2px);
        }
        .btn-cta-secondary:focus-visible {
            outline: 3px solid rgba(255,255,255,0.6);
            outline-offset: 3px;
        }
        .btn-cta-secondary:active {
            transform: translateY(0);
        }

        /* --- SERVICES SECTION --- */
        .services-section { padding: var(--section-pad-lg); background: var(--vimiss-surface); }
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-header h2 {
            font-family: var(--font-heading);
            font-size: 40px;
            font-weight: 700;
            color: var(--clr-text-dark);
            margin-bottom: 15px;
        }
        .section-header p {
            font-family: var(--font-sub);
            font-size: 18px;
            color: var(--clr-text-body);
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.6;
        }

        .service-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .service-card {
            background: var(--vimiss-surface-raised);
            border-radius: var(--radius);
            overflow: hidden;
            border-bottom: 3px solid var(--vimiss-accent);
            box-shadow: 0 5px 20px rgba(0,119,182,0.08);
            transition: all 0.3s ease;
            text-align: center;
        }
        .service-card:hover { border-bottom-color: var(--vimiss-purple); transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,119,182,0.12); }
        .service-card-img {
            height: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,119,182,0.05);
        }
        .service-card-img i { font-size: 60px; color: var(--vimiss-accent); }
        .service-card-body { padding: 30px 25px; }
        .service-card-body h3 {
            font-family: var(--font-heading);
            font-size: 20px;
            font-weight: 700;
            color: var(--clr-text-dark);
            margin-bottom: 12px;
        }
        .service-card-body p {
            font-size: 16px;
            color: var(--clr-text-body);
            line-height: 1.6;
        }
        .service-card-btn {
            display: inline-block;
            margin-top: 15px;
            padding: 8px 24px;
            border: 1px solid var(--vimiss-accent);
            border-radius: var(--radius);
            color: var(--vimiss-accent);
            font-weight: 600;
            font-size: 14px;
        }
        .service-card-btn:hover { background: var(--vimiss-cta-gradient); color: #fff; border-color: transparent; }

        /* --- ABOUT SECTION --- */
        .about-section { padding: 120px 0; background: var(--vimiss-bg); }
        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            align-items: center;
        }
        .about-images {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .about-images img {
            width: 100%;
            border-radius: var(--radius);
            object-fit: cover;
        }
        .about-text h2 {
            font-family: var(--font-heading);
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 20px;
        }
        .about-text p {
            font-size: 18px;
            color: var(--clr-text-body);
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .about-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
        }
        .about-list-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 16px;
            color: var(--clr-text-body);
        }
        .about-list-item i { color: var(--vimiss-accent); font-size: 18px; margin-top: 3px; }
        .btn-section-cta {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 25px;
            padding: 12px 30px;
            background: var(--vimiss-cta-gradient);
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            border-radius: 6px;
        }
        .btn-section-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,119,182,0.3); color: #fff; }

        /* --- STATS SECTION --- */
        .stats-section { padding: var(--section-pad-md); background: var(--vimiss-surface); }
        .stats-grid-inner {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border: 1px solid var(--vimiss-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }
        .stat-box {
            padding: 50px 30px;
            text-align: left;
            border-right: 1px solid var(--vimiss-border);
            border-bottom: 1px solid var(--vimiss-border);
        }
        .stat-box:nth-child(3n) { border-right: none; }
        .stat-box:nth-last-child(-n+3) { border-bottom: none; }
        .stat-box:nth-child(odd) { background: var(--vimiss-surface-raised); }
        .stat-number {
            font-size: 50px;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 8px;
        }
        .stat-number.green { color: var(--clr-counter-green); }
        .stat-number.red { color: var(--clr-counter-red); }
        .stat-number.blue { color: var(--clr-counter-blue); }
        .stat-number.gold { color: var(--clr-counter-gold); }
        .stat-number.indigo { color: var(--clr-counter-indigo); }
        .stat-number.dark { color: var(--clr-bg-dark); }
        .stat-label {
            font-size: 16px;
            font-weight: 600;
            color: var(--clr-text-dark);
        }

        /* --- WHY US SECTION --- */
        .why-section { padding: 120px 0; background: var(--vimiss-surface); }
        .why-section .section-header h2 { font-size: 40px; }
        .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: start; }
        .why-features { display: flex; flex-direction: column; gap: 25px; }
        .why-feature {
            display: flex;
            gap: 18px;
            align-items: flex-start;
        }
        .why-feature-icon {
            width: 52px;
            height: 52px;
            flex-shrink: 0;
            background: var(--vimiss-cta-gradient);
            border-radius: var(--radius);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 22px;
        }
        .why-feature h4 {
            font-family: var(--font-heading);
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 6px;
            color: var(--clr-text-dark);
        }
        .why-feature p {
            font-size: 16px;
            color: var(--clr-text-body);
            line-height: 1.5;
        }
        .why-image { text-align: center; }
        .why-image img { width: 100%; border-radius: var(--radius-lg); }

        /* --- TESTIMONIALS --- */
        .testimonials-section { padding: var(--section-pad-lg); background: var(--vimiss-bg); }
        .testimonial-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-top: 10px; }
        .testimonial-card {
            background: var(--vimiss-surface);
            border-radius: var(--radius);
            padding: 30px;
            box-shadow: 0 5px 20px rgba(0,119,182,0.06);
            border-top: 3px solid var(--vimiss-accent);
        }
        .testimonial-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
        }
        .testimonial-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 700;
            font-size: 20px;
            font-family: var(--font-heading);
            flex-shrink: 0;
        }
        .testimonial-name {
            font-family: var(--font-heading);
            font-size: 16px;
            font-weight: 700;
            color: var(--clr-text-dark);
        }
        .testimonial-role {
            font-size: 13px;
            color: var(--clr-text-muted);
            font-weight: 500;
        }
        .testimonial-stars { margin-left: auto; color: var(--clr-star); font-size: 13px; }
        .testimonial-stars i { margin-left: 2px; }
        .testimonial-text {
            font-size: 16px;
            color: var(--clr-text-body);
            line-height: 1.7;
            font-style: italic;
        }

        /* --- PARTNERS --- */
        .partners-section { padding: 40px 0; background: var(--vimiss-surface); border-top: 1px solid var(--vimiss-border); border-bottom: 1px solid var(--vimiss-border); }
        .partners-label {
            text-align: center;
            font-family: var(--font-sub);
            font-size: 16px;
            font-weight: 500;
            color: var(--clr-text-muted);
            margin-bottom: 25px;
        }
        .partners-logos {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 35px;
            flex-wrap: wrap;
        }
        .partners-logos img {
            height: 55px;
            object-fit: contain;
            filter: saturate(0) brightness(0.9);
            opacity: 0.6;
            transition: all 0.3s;
        }
        .partners-logos img:hover {
            filter: saturate(1) brightness(1);
            opacity: 1;
        }

        /* --- CTA Section (Dark) --- */
        .cta-section {
            padding: 80px 0 100px;
            background: linear-gradient(135deg, #005f92 0%, #0077B6 100%);
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .cta-section::before {
            content: '';
            position: absolute;
            top: -50%; left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(56,182,255,0.15) 0%, transparent 60%);
            border-radius: 50%;
        }
        .cta-section h2 {
            font-family: var(--font-heading);
            font-size: 36px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.4;
            margin-bottom: 20px;
            position: relative;
        }
        .cta-section p {
            font-size: 18px;
            color: var(--clr-text-white-80);
            max-width: 600px;
            margin: 0 auto 35px;
            line-height: 1.6;
            font-style: italic;
        }
        .cta-contact-row {
            display: flex;
            justify-content: center;
            gap: 25px;
            flex-wrap: wrap;
            margin-top: 40px;
        }
        .cta-contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: var(--radius);
            padding: 16px 24px;
        }
        .cta-contact-item i { color: #fff; font-size: 24px; }
        .cta-contact-item span { color: #fff; font-size: 16px; font-weight: 500; }

        /* --- FOOTER --- */
        .site-footer {
            background: var(--vimiss-surface);
            padding: 50px 0 30px;
            color: var(--vimiss-text);
            border-top: 1px solid var(--vimiss-border);
        }
        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .footer-col h4 {
            font-family: var(--font-heading);
            font-size: 20px;
            margin-bottom: 18px;
            color: var(--vimiss-accent);
        }
        .footer-col p, .footer-col a {
            color: var(--clr-text-body);
            font-size: 15px;
            line-height: 1.8;
        }
        .footer-col a:hover { color: var(--vimiss-primary); }
        .footer-links { display: flex; flex-direction: column; gap: 8px; }
        .footer-links a { display: flex; align-items: center; gap: 8px; }
        .footer-links a i { font-size: 12px; }
        .footer-social-links {
            display: flex;
            gap: 12px;
            margin-top: 15px;
        }
        .footer-social-links a {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,119,182,0.06);
            color: var(--vimiss-primary);
            font-size: 16px;
            border: 1px solid var(--vimiss-border);
        }
        .footer-social-links a:hover { background: var(--vimiss-cta-gradient); color: #fff; border-color: transparent; }
        .footer-bottom {
            border-top: 1px solid var(--vimiss-border);
            padding-top: 25px;
            text-align: center;
            font-size: 14px;
            color: var(--vimiss-muted);
        }
        .footer-bottom a { color: var(--vimiss-primary); }

        /* --- FLOATING CTA --- */
        .floating-cta {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: var(--vimiss-cta-gradient);
            padding: 14px 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            z-index: 9999;
            box-shadow: 0 -4px 25px rgba(0,119,182,0.25);
        }
        .floating-cta p {
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            font-family: var(--font-sub);
        }
        .btn-float-register {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 28px;
            background: #fff;
            color: var(--vimiss-primary);
            font-weight: 700;
            font-size: 14px;
            border-radius: 50px;
            font-family: var(--font-sub);
        }
        .btn-float-register:hover { background: #f0f0f0; transform: scale(1.03); color: var(--vimiss-primary); }

        /* --- Back to top --- */
        #back-top {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 999;
        }
        #back-top a {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            background: var(--vimiss-cta-gradient);
            color: #fff;
            border-radius: 50%;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(0,119,182,0.25);
        }
        #back-top a:hover { box-shadow: 0 6px 20px rgba(0,119,182,0.35); }

        /* =====================
           RESPONSIVE
           ===================== */
        @media (max-width: 1024px) {
            .hero-info-cards { grid-template-columns: repeat(2, 1fr); }
            .about-grid { grid-template-columns: 1fr; }
            .about-images { order: -1; }
            .stats-grid-inner { grid-template-columns: repeat(2, 1fr); }
            .stat-box:nth-child(2n) { border-right: none; }
            .why-grid { grid-template-columns: 1fr; }
            .why-image { order: -1; }
            .footer-grid { grid-template-columns: 1fr 1fr; }
            .hero-title { font-size: 36px; }
        }

        @media (max-width: 768px) {
            .header-nav { display: none; }
            .menu-toggle { display: block; }
            .hero-section { padding: 130px 0 60px; }
            .hero-title { font-size: 30px; }
            .hero-subtitle { font-size: 16px; }
            .hero-info-cards { grid-template-columns: 1fr; }
            .service-cards { grid-template-columns: 1fr; }
            .testimonial-cards { grid-template-columns: 1fr; }
            .stats-grid-inner { grid-template-columns: 1fr; }
            .stat-box { border-right: none !important; }
            .section-header h2 { font-size: 28px; }
            .section-header p { font-size: 16px; }
            .about-section { padding: 60px 0; }
            .why-section { padding: 60px 0; }
            .footer-grid { grid-template-columns: 1fr; }
            .floating-cta { flex-direction: column; gap: 10px; padding: 12px 20px; }
            .floating-cta p { font-size: 13px; text-align: center; }
            .cta-contact-row { flex-direction: column; align-items: center; }
            .hero-cta { flex-direction: column; align-items: center; }
            .btn-cta-primary, .btn-cta-secondary { width: 100%; max-width: 300px; justify-content: center; }
        }
    </style>
</head>
<body>

{{-- ==================== HEADER ==================== --}}
<header class="site-header">
    <div class="header-inner">
        <a href="/" class="header-logo">
            <img src="/images/logo/vimiss_logo_sologan.png" alt="VIMISS" onerror="this.outerHTML='<span style=\'color:#fff;font-family:Urbanist;font-size:24px;font-weight:800\'>VIMISS</span>'">
        </a>

        <div class="menu-toggle" onclick="document.querySelector('.header-nav').classList.toggle('show')">
            <span></span><span></span><span></span>
        </div>

        <nav class="header-nav">
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#dich-vu">Dịch vụ</a>
            <a href="#thanh-tuu">Thành tựu</a>
            <a href="#tai-sao">Tại sao chọn VIMISS?</a>
            <a href="#danh-gia">Đánh giá</a>
        </nav>

        <div class="auth-buttons">
            <a href="/auth/login" class="btn-login"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>
            <a href="/auth/register" class="btn-register-header"><i class="fas fa-user-plus"></i> Đăng ký</a>
        </div>
    </div>
</header>

{{-- ==================== HERO SECTION ==================== --}}
<section class="hero-section" id="top">
    <div class="container">
        <div class="hero-content">
            <h1 class="hero-title">
                HỆ THỐNG QUẢN LÝ<br><span>DU HỌC TRUNG QUỐC</span>
            </h1>
            <p class="hero-subtitle">
                Chào mừng bạn đến với VIMISS – Hệ thống quản lý du học thông minh giúp bạn theo dõi hồ sơ, học bổng và hành trình du học Trung Quốc một cách dễ dàng.
            </p>

            {{-- Hero CTA --}}
            <div class="hero-cta">
                <a href="/auth/register" class="btn-cta-primary">
                    <i class="fas fa-user-plus"></i> Đăng ký tài khoản
                </a>
                <a href="/auth/login" class="btn-cta-secondary">
                    <i class="fas fa-sign-in-alt"></i> Đăng nhập hệ thống
                </a>
            </div>

            {{-- Hero Info Cards --}}
            <div class="hero-info-cards">
                <div class="hero-info-card">
                    <div class="hero-info-card-icon"><i class="fas fa-building"></i></div>
                    <div>
                        <div class="hero-info-card-title">Công ty</div>
                        <div class="hero-info-card-desc">Công ty Hợp tác Quốc tế VIMISS</div>
                    </div>
                </div>
                <div class="hero-info-card">
                    <div class="hero-info-card-icon"><i class="fas fa-trophy"></i></div>
                    <div>
                        <div class="hero-info-card-title">Dịch vụ</div>
                        <div class="hero-info-card-desc">Số #1 Việt Nam</div>
                    </div>
                </div>
                <div class="hero-info-card">
                    <div class="hero-info-card-icon"><i class="fas fa-university"></i></div>
                    <div>
                        <div class="hero-info-card-title">Đối tác</div>
                        <div class="hero-info-card-desc">50+ Trường ĐH tại TQ</div>
                    </div>
                </div>
                <div class="hero-info-card">
                    <div class="hero-info-card-icon"><i class="fas fa-users"></i></div>
                    <div>
                        <div class="hero-info-card-title">Cộng đồng</div>
                        <div class="hero-info-card-desc">140K+ Thành viên</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- ==================== SERVICES SECTION ==================== --}}
<section class="services-section" id="dich-vu">
    <div class="container">
        <div class="section-header">
            <h2>DỊCH VỤ TẠI VIMISS</h2>
            <p>Du học Trung Quốc VIMISS ra đời lấy cảm hứng từ mong muốn đem lại giá trị cho cộng đồng du học. Với sự hợp tác thân thiết cùng các trường Đại học tại Trung Quốc, chúng tôi mong muốn đồng hành cùng bạn.</p>
        </div>

        <div class="service-cards">
            <div class="service-card">
                <div class="service-card-img">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="service-card-body">
                    <h3>Hỗ trợ Apply Học bổng</h3>
                    <p>Dịch vụ hỗ trợ apply học bổng Trung Quốc số #1 Việt Nam. Đã hỗ trợ thành công cho hơn 1100 khách hàng đỗ học bổng.</p>
                    <a href="/auth/register" class="service-card-btn">Tìm hiểu thêm →</a>
                </div>
            </div>

            <div class="service-card">
                <div class="service-card-img">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="service-card-body">
                    <h3>Quản lý Hồ sơ Online</h3>
                    <p>Hệ thống theo dõi và quản lý hồ sơ du học thông minh. Cập nhật trạng thái hồ sơ theo thời gian thực 24/7.</p>
                    <a href="/auth/register" class="service-card-btn">Bắt đầu ngay →</a>
                </div>
            </div>

            <div class="service-card">
                <div class="service-card-img">
                    <i class="fas fa-headset"></i>
                </div>
                <div class="service-card-body">
                    <h3>Tư vấn Du học 24/7</h3>
                    <p>Đội ngũ chuyên gia tư vấn du học Trung Quốc giàu kinh nghiệm. Hỗ trợ tư vấn mọi lúc và đồng hành suốt hành trình.</p>
                    <a href="/auth/register" class="service-card-btn">Liên hệ ngay →</a>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- ==================== ABOUT / GIỚI THIỆU SECTION ==================== --}}
<section class="about-section" id="gioi-thieu">
    <div class="container">
        {{-- Intro Header --}}
        <div class="section-header" style="margin-bottom: 60px;">
            <h2>GIỚI THIỆU CHUNG</h2>
            <p>Sau nhiều năm ấp ủ và lên kế hoạch, tháng 12/2018, VIMISS chính thức ra đời với đầy đủ tôn chỉ, mục đích hoạt động về mảng du học Trung Quốc.</p>
        </div>

        {{-- Key Numbers --}}
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 60px;">
            <div style="background: var(--vimiss-surface); border-radius: var(--radius); padding: 30px; text-align: center; border: 1px solid var(--vimiss-border);">
                <div style="font-size: 48px; font-weight: 700; color: var(--vimiss-accent); line-height: 1;">2018</div>
                <div style="font-size: 14px; color: var(--vimiss-muted); margin-top: 8px;">Năm thành lập</div>
            </div>
            <div style="background: var(--vimiss-surface); border-radius: var(--radius); padding: 30px; text-align: center; border: 1px solid var(--vimiss-border);">
                <div style="font-size: 48px; font-weight: 700; color: var(--clr-primary-light); line-height: 1;">99+</div>
                <div style="font-size: 14px; color: var(--vimiss-muted); margin-top: 8px;">Nhân sự</div>
            </div>
            <div style="background: var(--vimiss-surface); border-radius: var(--radius); padding: 30px; text-align: center; border: 1px solid var(--vimiss-border);">
                <div style="font-size: 48px; font-weight: 700; color: var(--vimiss-primary); line-height: 1;">02</div>
                <div style="font-size: 14px; color: var(--vimiss-muted); margin-top: 8px;">Chi nhánh</div>
            </div>
        </div>

        {{-- About content --}}
        <div class="about-grid">
            <div class="about-text">
                <h2 style="color: var(--vimiss-accent);">Về VIMISS</h2>
                <p>VIMISS là đơn vị đã tổ chức rất nhiều các buổi hội thảo du học miễn phí để chia sẻ kinh nghiệm khi du học Trung Quốc, các chương trình hiện có của Chính phủ Trung Quốc và ký kết hợp tác với nhiều trường đại học lớn tại Trung Quốc.</p>
                <p>VIMISS là hệ thống quản lý du học thông minh giúp học sinh dễ dàng theo dõi hồ sơ, cập nhật tiến độ apply học bổng và kết nối với tư vấn viên.</p>

                <div class="about-list">
                    <div class="about-list-item">
                        <i class="fas fa-check-circle"></i>
                        <span>10+ năm kinh nghiệm trong lĩnh vực du học Trung Quốc</span>
                    </div>
                    <div class="about-list-item">
                        <i class="fas fa-check-circle"></i>
                        <span>100+ khu vực du học – 60+ trường đối tác</span>
                    </div>
                    <div class="about-list-item">
                        <i class="fas fa-check-circle"></i>
                        <span>3000+ hồ sơ thành công</span>
                    </div>
                    <div class="about-list-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Kênh du học Trung Quốc chính thống duy nhất tại Việt Nam được Hán Khảo Quốc tế bảo trợ</span>
                    </div>
                </div>

                <a href="/auth/register" class="btn-section-cta">
                    <i class="fas fa-arrow-right"></i> Đăng ký ngay
                </a>
            </div>

            <div>
                {{-- Vision box --}}
                <div style="background: var(--vimiss-surface); border-radius: var(--radius-lg); padding: 30px; border: 1px solid var(--vimiss-border);">
                    <p style="color: var(--vimiss-accent); font-weight: 700; text-align: center; font-size: 16px; margin-bottom: 15px;">
                        YOUR VISION, OUR MISSION
                    </p>
                    <p style="text-align: center; color: var(--vimiss-muted); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">
                        Tầm nhìn của bạn, sứ mệnh của chúng tôi
                    </p>
                    <p style="color: var(--clr-text-body); font-size: 15px; line-height: 1.7;">
                        <strong style="color: var(--vimiss-text);">Du Học VIMISS</strong> thể hiện sứ mệnh lớn lao – chúng tôi mong muốn có thể định hướng, đưa các bạn học sinh lựa chọn được những con đường đúng đắn nhất, chính xác nhất và nhanh nhất để có thể đạt đến thành công.
                    </p>
                </div>

                {{-- Timeline --}}
                <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--vimiss-accent); margin-top: 7px; flex-shrink: 0;"></div>
                        <div>
                            <div style="font-weight: 600; color: var(--vimiss-accent); font-size: 14px;">Năm 2018 – Thành lập</div>
                            <div style="font-size: 13px; color: var(--clr-text-body); margin-top: 4px;">Thành lập Công ty TNHH Du học VIMISS Việt Nam. Lĩnh vực: Du học & Định cư.</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--vimiss-primary); margin-top: 7px; flex-shrink: 0;"></div>
                        <div>
                            <div style="font-weight: 600; color: var(--vimiss-accent); font-size: 14px;">Trụ sở Hà Nội</div>
                            <div style="font-size: 13px; color: var(--clr-text-body); margin-top: 4px;">Toà SENCO building, Tân Triều, Thanh Trì, Hà Nội</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--clr-primary-light); margin-top: 7px; flex-shrink: 0;"></div>
                        <div>
                            <div style="font-weight: 600; color: var(--vimiss-accent); font-size: 14px;">Trụ sở TP.HCM</div>
                            <div style="font-size: 13px; color: var(--clr-text-body); margin-top: 4px;">168/19 đường Nguyễn Gia Trí, Phường 25, Bình Thạnh, TP.HCM</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- ==================== STATS SECTION ==================== --}}
<section class="stats-section" id="thanh-tuu">
    <div class="container">
        <div class="section-header" style="margin-bottom: 40px;">
            <h2>THÀNH TỰU ĐẠT ĐƯỢC</h2>
            <p>Những con số ấn tượng khẳng định vị thế hàng đầu của chúng tôi trong lĩnh vực tư vấn du học Trung Quốc.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
            <div class="stats-grid-inner">
                <div class="stat-box">
                    <div class="stat-number green">1100+</div>
                    <div class="stat-label">Khách hàng đỗ học bổng</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number dark">50+</div>
                    <div class="stat-label">Trường ĐH đối tác</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number red">93%</div>
                    <div class="stat-label">Tỉ lệ đỗ học bổng</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number blue">140K+</div>
                    <div class="stat-label">Thành viên cộng đồng</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number gold">30+</div>
                    <div class="stat-label">Nhân sự chuyên môn</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number indigo">5+</div>
                    <div class="stat-label">Năm hoạt động</div>
                </div>
            </div>
            <div style="text-align: center;">
                <img src="/landing-assets/VIMISS-Cup-370x600-1.png" alt="Cup TOP 10" style="max-height: 450px; margin: 0 auto; border-radius: var(--radius-lg);" onerror="this.parentElement.style.display='none'">
            </div>
        </div>
    </div>
</section>

{{-- ==================== WHY CHOOSE US SECTION ==================== --}}
<section class="why-section" id="tai-sao">
    <div class="container">
        <div class="section-header">
            <h2>TẠI SAO KHÁCH HÀNG TIN TƯỞNG CHÚNG TÔI?</h2>
            <p>Giữa sự cạnh tranh khốc liệt của thị trường, VIMISS vẫn giữ vị trí vững chắc bằng chất lượng dịch vụ và những giá trị riêng.</p>
        </div>

        <div class="why-grid">
            <div class="why-features">
                <div class="why-feature">
                    <div class="why-feature-icon"><i class="fas fa-user-tie"></i></div>
                    <div>
                        <h4>Đội ngũ chuyên gia</h4>
                        <p>Tập hợp chuyên gia & du học sinh Trung Quốc nhiệt huyết, am hiểu học bổng, tận tâm với khách hàng.</p>
                    </div>
                </div>
                <div class="why-feature">
                    <div class="why-feature-icon"><i class="fas fa-award"></i></div>
                    <div>
                        <h4>Tỉ lệ đỗ cao lên tới 98%</h4>
                        <p>Đã hỗ trợ hơn 1100 khách đỗ học bổng, dịch vụ uy tín nhất thị trường với chi phí tốt nhất.</p>
                    </div>
                </div>
                <div class="why-feature">
                    <div class="why-feature-icon"><i class="fas fa-shield-alt"></i></div>
                    <div>
                        <h4>Cam kết hoàn tiền</h4>
                        <p>Bao trọn gói hồ sơ, hỗ trợ Visa, hoàn tiền nếu trượt. Công khai minh bạch mọi thông tin.</p>
                    </div>
                </div>
                <div class="why-feature">
                    <div class="why-feature-icon"><i class="fas fa-laptop-code"></i></div>
                    <div>
                        <h4>Hệ thống VIMISS thông minh</h4>
                        <p>Theo dõi hồ sơ, tiến độ apply, nhận thông báo cập nhật – tất cả trong một nền tảng duy nhất.</p>
                    </div>
                </div>
                <div class="why-feature">
                    <div class="why-feature-icon"><i class="fas fa-heart"></i></div>
                    <div>
                        <h4>Đồng hành sau khi đỗ</h4>
                        <p>Hỗ trợ tư vấn 24/7 kể cả sau khi đỗ học bổng. Luôn sẵn sàng giải đáp mọi thắc mắc.</p>
                    </div>
                </div>
                <div class="why-feature">
                    <div class="why-feature-icon"><i class="fas fa-globe-asia"></i></div>
                    <div>
                        <h4>Mạng lưới đối tác rộng</h4>
                        <p>Hợp tác thân thiết với 50+ trường Đại học hàng đầu tại Trung Quốc.</p>
                    </div>
                </div>
            </div>
            <div class="why-image">
                <img src="/landing-assets/Van-phong-VIMISS-2.png" alt="Văn phòng VIMISS" style="max-height: 500px; object-fit: cover;" onerror="this.parentElement.style.display='none'">
                <a href="/auth/register" class="btn-section-cta" style="margin-top: 30px;">
                    <i class="fas fa-arrow-right"></i> Đăng ký sử dụng VIMISS
                </a>
            </div>
        </div>
    </div>
</section>

{{-- ==================== TESTIMONIALS ==================== --}}
<section class="testimonials-section" id="danh-gia">
    <div class="container">
        <div class="section-header">
            <h2>ĐÁNH GIÁ CỦA KHÁCH HÀNG</h2>
            <p>Sự hài lòng của khách hàng chính là minh chứng rõ ràng nhất cho chất lượng dịch vụ hàng đầu.</p>
        </div>

        <div class="testimonial-cards">
            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="testimonial-avatar" style="background: var(--clr-primary);">P</div>
                    <div>
                        <div class="testimonial-name">Phan Thị Anh Tú</div>
                        <div class="testimonial-role">Thạc sĩ – Đại học Tây Nam</div>
                    </div>
                    <div class="testimonial-stars">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                    </div>
                </div>
                <p class="testimonial-text">"Đội ngũ của VIMISS luôn nhiệt tình hỗ trợ mình mọi lúc, giải đáp mọi thắc mắc, thái độ rất dễ thương. Dịch vụ rất tốt, highly recommend!"</p>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="testimonial-avatar" style="background: var(--clr-bg-dark);">N</div>
                    <div>
                        <div class="testimonial-name">Nguyễn Thị Thúy</div>
                        <div class="testimonial-role">Thạc sĩ – Đại học Tây Nam</div>
                    </div>
                    <div class="testimonial-stars">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                    </div>
                </div>
                <p class="testimonial-text">"Anh Duy cực có tâm luôn support động viên mình trong suốt quá trình apply. Highly recommend cho các bạn đang tìm trung tâm hỗ trợ hồ sơ du học."</p>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="testimonial-avatar" style="background: var(--clr-primary-vivid);">N</div>
                    <div>
                        <div class="testimonial-name">Nguyễn Thị Nhàn</div>
                        <div class="testimonial-role">Thạc sĩ – Đại học Vũ Hán</div>
                    </div>
                    <div class="testimonial-stars">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                    </div>
                </div>
                <p class="testimonial-text">"Anh luôn nhiệt tình tư vấn và giúp đỡ trong mọi trường hợp, có tâm thật sự luôn. Cuối cùng cũng nhận được kết quả như mong muốn!"</p>
            </div>
        </div>
    </div>
</section>

{{-- ==================== PARTNERS ==================== --}}
<section class="partners-section">
    <div class="container">
        <p class="partners-label">Đối tác trường Đại học hàng đầu Trung Quốc</p>
        <div class="partners-logos">
            <img src="/images/univer/Logo-Dai-hoc-Bac-Kinh.png" alt="ĐH Bắc Kinh" onerror="this.style.display='none'">
            <img src="/images/univer/Logo-Dai-hoc-Nam-Kinh.png" alt="ĐH Nam Kinh" onerror="this.style.display='none'">
            <img src="/images/univer/Logo-Dai-hoc-Ngon-ngu-Bac-Kinh.png" alt="ĐH Ngôn ngữ Bắc Kinh" onerror="this.style.display='none'">
            <img src="/images/univer/Logo-Dai-hoc-Thuong-Hai.png" alt="ĐH Thượng Hải" onerror="this.style.display='none'">
            <img src="/images/univer/Logo-Dai-hoc-Trung-Son.png" alt="ĐH Trung Sơn" onerror="this.style.display='none'">
            <img src="/landing-assets/Logo-Dai-hoc-Hoa-Kieu.png" alt="ĐH Hoa Kiều" onerror="this.style.display='none'">
            <img src="/landing-assets/Logo-Dai-hoc-Ngoai-ngu-Chiet-Giang.png" alt="ĐH Ngoại ngữ Chiết Giang" onerror="this.style.display='none'">
            <img src="/landing-assets/Logo-Dai-hoc-Ngoai-ngu-Dai-Lien.png" alt="ĐH Ngoại ngữ Đại Liên" onerror="this.style.display='none'">
            <img src="/landing-assets/Logo-Dai-hoc-Su-pham-Cap-Nhi-Tan.png" alt="ĐH Sư phạm Cáp Nhĩ Tân" onerror="this.style.display='none'">
            <img src="/landing-assets/Logo-Dai-hoc-Su-pham-Chiet-Giang.png" alt="ĐH Sư phạm Chiết Giang" onerror="this.style.display='none'">
            <img src="/landing-assets/Logo-Dai-hoc-Tay-Nam.png" alt="ĐH Tây Nam" onerror="this.style.display='none'">
            <img src="/landing-assets/Logo-Dai-hoc-Thanh-Do.png" alt="ĐH Thành Đô" onerror="this.style.display='none'">
        </div>
    </div>
</section>

{{-- ==================== CTA SECTION ==================== --}}
<section class="cta-section">
    <div class="container">
        <h2>Sẵn sàng bắt đầu<br>hành trình du học?</h2>
        <p>Đăng ký tài khoản VIMISS ngay hôm nay để theo dõi hồ sơ, nhận tư vấn và chinh phục học bổng Trung Quốc!</p>
        <a href="/auth/register" class="btn-cta-primary" style="font-size: 18px; padding: 20px 40px;">
            <i class="fas fa-user-plus"></i> Đăng ký miễn phí
        </a>

        <div class="cta-contact-row">
            <div class="cta-contact-item">
                <i class="fas fa-phone-alt"></i>
                <span>0888 666 350</span>
            </div>
            <div class="cta-contact-item">
                <i class="fas fa-envelope"></i>
                <span>admin@vimiss.vn</span>
            </div>
            <div class="cta-contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>Lô 22, BT4-3, Trung Văn, Hà Nội</span>
            </div>
        </div>
    </div>
</section>

{{-- ==================== FOOTER ==================== --}}
<footer class="site-footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-col">
                <h4>VIMISS – Hệ thống Quản lý Du học</h4>
                <p>Công ty TNHH Hợp tác quốc tế VIMISS<br>
                Lô 22, BT4-3, đường Trung Thư, Trung Văn, Nam Từ Liêm, Hà Nội.</p>
                <p style="margin-top: 10px;">
                    <i class="fas fa-envelope" style="margin-right: 8px;"></i> admin@vimiss.vn<br>
                    <i class="fas fa-phone-alt" style="margin-right: 8px;"></i> 0888 666 350
                </p>
                <div class="footer-social-links">
                    <a href="https://www.facebook.com/VIMISS.vn/" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a>
                    <a href="https://youtube.com/@duhoctrungquocvimiss/" target="_blank" rel="noopener"><i class="fab fa-youtube"></i></a>
                    <a href="https://vimiss.vn" target="_blank" rel="noopener"><i class="fas fa-globe"></i></a>
                </div>
            </div>
            <div class="footer-col">
                <h4>Dịch vụ</h4>
                <div class="footer-links">
                    <a href="/auth/register"><i class="fas fa-chevron-right"></i> Đăng ký tài khoản</a>
                    <a href="/auth/login"><i class="fas fa-chevron-right"></i> Đăng nhập</a>
                    <a href="#dich-vu"><i class="fas fa-chevron-right"></i> Dịch vụ VIMISS</a>
                    <a href="#gioi-thieu"><i class="fas fa-chevron-right"></i> Giới thiệu</a>
                </div>
            </div>
            <div class="footer-col">
                <h4>Liên kết</h4>
                <div class="footer-links">
                    <a href="https://vimiss.vn" target="_blank"><i class="fas fa-chevron-right"></i> VIMISS.vn</a>
                    <a href="https://vimiss.vn/blog/" target="_blank"><i class="fas fa-chevron-right"></i> Blog</a>
                    <a href="https://vimiss.vn/thong-tin-hoc-bong-trung-quoc/" target="_blank"><i class="fas fa-chevron-right"></i> Thông tin học bổng</a>
                    <a href="https://vimiss.vn/lien-he/" target="_blank"><i class="fas fa-chevron-right"></i> Liên hệ</a>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; {{ date('Y') }} VIMISS – Hệ thống Quản lý Du học. Powered by <a href="https://vimiss.vn/" target="_blank">VIMISS Team</a></p>
        </div>
    </div>
</footer>

{{-- ==================== FLOATING CTA BAR ==================== --}}
<div class="floating-cta">
    <p><i class="fas fa-graduation-cap" style="margin-right: 6px;"></i> Bạn là học sinh? Đăng ký tài khoản để bắt đầu hành trình du học!</p>
    <a href="/auth/register" class="btn-float-register">
        <i class="fas fa-user-plus"></i> Đăng ký ngay
    </a>
</div>

{{-- Back to top --}}
<div id="back-top" style="display: none;">
    <a href="#top"><i class="fas fa-angle-up"></i></a>
</div>

<script>
    // Back to top visibility
    window.addEventListener('scroll', function() {
        var backTop = document.getElementById('back-top');
        backTop.style.display = window.scrollY > 300 ? 'block' : 'none';
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Mobile nav toggle
    document.querySelector('.menu-toggle').addEventListener('click', function() {
        var nav = document.querySelector('.header-nav');
        if (nav.style.display === 'flex') {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '70px';
            nav.style.left = '0';
            nav.style.right = '0';
            nav.style.background = 'var(--vimiss-surface)';
            nav.style.padding = '10px 20px 20px';
            nav.style.boxShadow = '0 10px 20px rgba(0,119,182,0.1)';
        }
    });
</script>
</body>
</html>
