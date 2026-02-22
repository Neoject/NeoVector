<?php
http_response_code(404);

require_once 'header.php';
?>

<body>
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 40px;">
        <div>
            <h1 style="font-size: 32px; margin-bottom: 16px;">Страница не найдена</h1>
            <p style="margin-bottom: 24px;">К сожалению, запрошенная страница не существует или была удалена.</p>
            <a href="/" class="btn btn-primary">На главную</a>
        </div>
    </div>
</body>
