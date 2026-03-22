        <footer v-if="block && block.type === 'footer' && block.is_active" class="footer-block">
            <div class="container" style="flex: 1">
                <div class="paysystems">
                    <ul>
                        <li><img src="src/images/bepaid.png"></li>
                        <li><img src="src/images/erip.svg"></li>
                    </ul>
                    <ul>
                        <li><img src="src/images/visa.png"></li>
                        <li><img src="src/images/mastercard.png"></li>
                        <li><img src="src/images/belkart.png"></li>
                        <li><img src="src/images/apple-pay.webp"></li>
                        <li><img src="src/images/samsung-pay.png"></li>
                        <li><img src="src/images/google-pay.webp"></li>
                    </ul>
                </div>
                <div class="footer-content" :class="{ 'animated': isInView('footer-content-' + block.id) }"
                     :id="'footer-content-' + block.id" v-html="block.content"></div>
                <div class="footer-copyright">
                    <div class="copyright-block">
                        Copyright © 2025, NeoVector — Все права защищены
                    </div>
                    <div class="neoject">
                        Сайт разработан
                        <a class="btn btn-outline" style="border:none" href="https://neoject.by" target="_blank">neoject.by</a>
                    </div>
                </div>
            </div>
        </footer>
        <script src="<?=NV?>/main/js/sections.js"></script>
    </body>
</html>
