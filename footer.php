<?php
// Определяем базовый путь относительно корня сайта
$basePath = dirname($_SERVER['PHP_SELF']);
$basePath = $basePath === '/' ? '' : $basePath;
$basePath = str_replace('\\', '/', $basePath);
?>
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <p>&copy; <span id="current-year"></span> Neoject</p>
                <div class="footer-links">
                    <a href="<?= $basePath ?>/index.php#home">Главная</a>
                    <a href="<?= $basePath ?>/index.php#about">Обо мне</a>
                    <a href="<?= $basePath ?>/index.php#projects">Проекты</a>
                    <a href="<?= $basePath ?>/index.php#contact">Контакты</a>
                </div>
                <!--<div class="footer-links">
                    <a href="">Политика конфиденциальности</a>
                    <a href="cookies/">Политика использования файлов куки (cookie)</a>
                </div>-->
            </div>
        </div>
    </footer>
</div>
<script src="app.js"></script>
<script src="main.js"></script>
</body>
</html>