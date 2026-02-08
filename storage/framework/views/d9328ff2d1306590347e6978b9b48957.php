<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">

    <title><?php echo e(config('app.name', 'Vimiss Study Abroad')); ?></title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Vite Assets -->
    <?php if(app()->environment('local') && file_exists(public_path('hot'))): ?>
        <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php endif; ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.jsx']); ?>
</head>

<body>
    <div id="app"></div>
</body>

</html>
<?php /**PATH D:\CODE\vimiss-study-abroad-management\resources\views/spa.blade.php ENDPATH**/ ?>