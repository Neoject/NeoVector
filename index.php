<?php

use NeoVision\ApiController;
use NeoVision\Database;
use NeoVision\PageBlock;
use NeoVision\Router;

$TITLE = 'Neoject - разработка сайтов';

require_once __DIR__ . '/header.php';

global $HOME_URL, $_DESCRIPTION;

try {
    $router = new Router();
} catch (Exception $e) {
    error_log('Router initialization error: ' . $e->getMessage());
    http_response_code(500);
    die('Internal Server Error');
}

$router->add('GET', '/api/page', function () {
    try {
        $controller = new ApiController();
        return $controller->getPage('home');
    } catch (Exception $e) {
        error_log('API Controller error: ' . $e->getMessage());
        http_response_code(500);
        return json_encode(['error' => 'Internal Server Error'], JSON_UNESCAPED_UNICODE);
    }
});

$router->add('GET', '/api/page/{slug}', function ($slug) {
    try {
        $controller = new ApiController();
        return $controller->getPage($slug);
    } catch (Exception $e) {
        error_log('API Controller error: ' . $e->getMessage());
        http_response_code(500);
        return json_encode(['error' => 'Internal Server Error'], JSON_UNESCAPED_UNICODE);
    }
});

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $excludedPaths = ['/admin', '/product', '/assets', '/api.php', '/favicon.ico'];
    $isExcluded = false;

    foreach ($excludedPaths as $excluded) {
        if (strpos($uri, $excluded) === 0) {
            $isExcluded = true;
            break;
        }
    }

    if (strpos($uri, '/api/') === 0) {
        $result = $router->dispatch($method, $uri);
        echo $result;
        exit;
    }
} catch (Exception $e) {
    error_log('Request handling error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    die('Internal Server Error');
}

$heroImage = '';

try {
    $dbConnection = Database::getInstance()->getConnection();
    $pageBlock = new PageBlock($dbConnection);
    $heroImage = $pageBlock->getHeroImage();

    if ($heroImage && !preg_match('/^https?:\/\//i', $heroImage)) {
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $baseDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        $heroImage = $protocol . '://' . $host . $baseDir . '/' . ltrim($heroImage, '/');
    }
} catch (Exception $e) {
    error_log('Hero image retrieval error: ' . $e->getMessage());
}
?>
    <div id="app">
        <main>
            <!-- Hero Section -->
            <section id="home" class="hero">
                <div class="hero-content container">
                    <div class="hero-text">
                        <h1 class="hero-title">
                            Одностраничные и сложные <span class="highlight">сайты</span> под реальные задачи
                        </h1>
                        <p class="hero-subtitle">
                            Делаем сайты удобными, быстрыми и понятными для пользователей
                        </p>
                        <div class="hero-buttons">
                            <button class="btn btn-primary" data-scroll="projects">Мои проекты</button>
                            <button class="btn btn-outline" data-scroll="contact">Связаться</button>
                        </div>
                    </div>
                    <div class="hero-image">
                        <div class="code-block">
                            <ul class="developer">
                                <li>Понятная структура без магии и хаоса</li>
                                <li>Осмысленная архитектура, а не заплатки</li>
                                <li>Фокус на цели проекта, а не просто красивый внешний вид</li>
                                <li>Интерфейсы, которые помогают продавать</li>
                                <li>Логика интерфейса, понятная без инструкций</li>
                                <li>UX, который не бесит пользователей</li>
                                <li>Проекты, которые легко дорабатывать</li>
                                <li>Без боли при масштабировании</li>
                                <li>Оптимизация загрузки и отклика</li>
                                <li>Адекватная работа на мобильных устройствах</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="scroll-indicator"><span>↓</span></div>
            </section>

            <!-- About Section -->
            <section id="about" class="about">
                <div class="container">
                    <h2 class="section-title">О Neoject</h2>
                    <div class="about-content">
                        <div class="about-text">
                            <p>Создание современных сайтов и веб-приложений. Специализация на fullstack разработке с использованием PHP, Node.js, Javascript (Vue.js, React и других современных фреймворков).</p>
                            <p>Создаем не только функциональные, но и красивые сайты, которые обеспечивают отличный пользовательский опыт.</p>
                            <div class="skills">
                                <h3>Навыки</h3>
                                <div class="skills-list" id="skills-list">
                                    <span class="skill-tag" data-skill="PHP">PHP</span>
                                    <span class="skill-tag" data-skill="Javascript">Javascript</span>
                                    <span class="skill-tag" data-skill="Typescript">Typescript</span>
                                    <span class="skill-tag" data-skill="Node.js">Node.js</span>
                                    <span class="skill-tag" data-skill="Vue.js">Vue.js</span>
                                    <span class="skill-tag" data-skill="Electron">Electron</span>
                                    <span class="skill-tag" data-skill="HTML/CSS">HTML/CSS</span>
                                    <span class="skill-tag" data-skill="Git">Git</span>
                                    <span class="skill-tag" data-skill="Responsive design">Responsive design</span>
                                    <span class="skill-tag" data-skill="UI/UX">UI/UX</span>
                                </div>
                            </div>
                        </div>
                        <div class="about-image">
                            <div class="image-placeholder">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="100" cy="100" r="80" fill="url(#gradient)" />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                                            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
                                        </linearGradient>
                                    </defs>
                                    <text x="100" y="110" font-size="60" fill="white" text-anchor="middle" font-weight="bold">DEV</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Projects Section -->
            <section id="projects" class="projects">
                <div class="container">
                    <h2 class="section-title">Мои проекты</h2>
                    <div class="projects-grid">
                        <div class="project-card">
                            <div class="project-image">
                                <div class="project-placeholder"><span>🎨</span></div>
                            </div>
                            <div class="project-content">
                                <h3>Shelfer</h3>
                                <p>Десктопное приложение для планировки товарной выкладки</p>
                                <div class="project-tech">
                                    <span class="tech-tag">Vue.js</span>
                                    <span class="tech-tag">Vite</span>
                                    <span class="tech-tag">JavaScript</span>
                                    <span class="tech-tag">Electron</span>
                                    <span class="tech-tag">Typescript</span>
                                    <span class="tech-tag">Node.js</span>
                                </div>
                                <div class="project-links">
                                    <a href="https://github.com/Neoject/shelfer" target="_blank" class="btn btn-outline btn-sm">GitHub</a>
                                </div>
                            </div>
                        </div>
                        <div class="project-card">
                            <div class="project-image">
                                <div class="project-placeholder"><span>🛒</span></div>
                            </div>
                            <div class="project-content">
                                <h3>Aeternum</h3>
                                <p>Полнофункциональный интернет-магазин с корзиной покупок и системой заказов</p>
                                <div class="project-tech">
                                    <span class="tech-tag">Vue.js</span>
                                    <span class="tech-tag">php</span>
                                </div>
                                <div class="project-links">
                                    <a href="https://aeternum.by" target="_blank" class="btn btn-primary btn-sm">Aeternum.by</a>
                                </div>
                            </div>
                        </div>
                        <div class="project-card">
                            <div class="project-image">
                                <div class="project-placeholder"><span>📊</span></div>
                            </div>
                            <div class="project-content">
                                <h3>Media Rocket</h3>
                                <p>Приложение для передачи файлов между ПК и смартфоном на Android</p>
                                <div class="project-tech">
                                    <span class="tech-tag">Kotlin</span>
                                    <span class="tech-tag">Vue.js</span>
                                    <span class="tech-tag">Electron</span>
                                    <span class="tech-tag">TypeScript</span>
                                </div>
                                <div class="project-links">
                                    <a href="https://github.com/Neoject/media-rocket" target="_blank" class="btn btn-outline btn-sm">Media Rocket</a>
                                    <a href="https://github.com/Neoject/mediarocket-desktop" target="_blank" class="btn btn-outline btn-sm">Media Rocket desktop</a>
                                </div>
                            </div>
                        </div>
                        <div class="project-card">
                            <div class="project-image">
                                <div class="project-placeholder"><span>🏥</span></div>
                            </div>
                            <div class="project-content">
                                <h3>ModCare</h3>
                                <p>Сайт для медицинской консультации с помощью ИИ</p>
                                <div class="project-tech">
                                    <span class="tech-tag">Node.js</span>
                                    <span class="tech-tag">Vue</span>
                                    <span class="tech-tag">JavaScript</span>
                                </div>
                                <div class="project-links">
                                    <a href="https://github.com/Neoject/modcure" target="_blank" class="btn btn-outline btn-sm">GitHub</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Contact Section -->
            <section id="contact" class="contact">
                <div class="container">
                    <h2 class="section-title">Контакты для связи со мной</h2>
                    <div class="contact-content">
                        <div class="contact-info">
                            <p>Готов обсудить ваши проекты и возможности сотрудничества</p>
                            <div class="contact-items">
                                <a href="mailto:contact@neoject.ru" class="contact-item">
                                    <span class="contact-icon">📧</span>
                                    <span>contact@neoject.ru</span>
                                </a>
                                <a href="tel:+375297017959" class="contact-item">
                                    <span class="contact-icon"><i class="fa-solid fa-phone"></i></span>
                                    <span>+375 (29) 701-79-59</span>
                                </a>
                                <a href="tg://resolve?domain=neoject_dev" class="contact-item">
                                    <span class="contact-icon"><i class="fa-brands fa-telegram"></i></span>
                                    <span>Telegram: @neoject_dev</span>
                                </a>

                                <a href="https://github.com/Neoject" target="_blank" class="contact-item">
                                    <span class="contact-icon">💼</span>
                                    <span>GitHub</span>
                                </a>
                                <a href="https://www.linkedin.com/in/alexander-yakubovsky-06a293223?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" class="contact-item">
                                    <span class="contact-icon">🔗</span>
                                    <span>LinkedIn</span>
                                </a>
                            </div>
                        </div>
                        <form class="contact-form" id="contact-form">
                            <p>Или вы можете написать нам ваши пожелания</p>
                            <div class="form-group">
                                <input type="text" id="form-name" placeholder="Ваше имя" required />
                            </div>
                            <div class="form-group">
                                <input type="email" id="form-email" placeholder="Ваш email" required />
                            </div>
                            <div class="form-group">
                                <textarea id="form-message" placeholder="Ваше сообщение" rows="5" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" id="form-submit">
                                Отправить
                            </button>
                            <div id="form-success" class="alert success" style="display: none;">
                                Сообщение успешно отправлено!
                            </div>
                            <div id="form-error" class="alert error" style="display: none;"></div>
                        </form>
                    </div>
                </div>
            </section>
        </main>

        <?php include 'footer.php'; ?>
    </div>
