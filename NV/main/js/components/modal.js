const Modal = {
    template: `
        <teleport to="body">
            <div class="overlay">
              <div class="modal-window">
                <div class="modal-content">
                  <slot></slot>
                </div>
              </div>
            </div>
        </teleport>
    `,
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        closeWindow() {
            this.$emit('close');
        },
        handleClickOutside() {
            if (this.$refs.window && !this.$refs.window.contains(event.target)) {
                this.zIndex = 999;
            } else {
                this.zIndex = 1000;
            }
        }
    }
}