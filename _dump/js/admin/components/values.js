export const Values = {
  data() {
    return {
      mobileMenuOpen: false,
      _messages: [],
      _selectedMessage: null,
      uploadSuccess: false,
      uploadError: false,
      uploadErrorMessage: '',
      uploadXhr: null,
    }
  },
  computed: {
    messages: {
      get() {
        return this.$root?._messages ?? []
      },
      set(val) {
        this.$root._messages = val
      }
    },
    selectedMessage: {
      get() {
        return this.$root?._selectedMessage ?? null
      },
      set(val) {
        this.$root._selectedMessage = val
      }
    }
  },
  methods: {
    isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    async getMessages() {
      try {
        const response = await fetch('../api.php?action=messages', { credentials: 'same-origin' })
        if (!response.ok) return
        const res = await response.json()
        if (res && res.success && res.data) {
          this.messages = res.data
        } else if (Array.isArray(res)) {
          this.messages = res
        } else {
          this.messages = []
        }
      } catch (e) {
        console.error('Error loading messages', e)
      }
    },
    changePage(page) {
      this.$root.page = page
      this.$root.closeMobileMenu()

      const loader = document.getElementById('block_loader')
      if (loader) loader.style.display = 'flex'

      if (page === 'analytics') {
        this.$nextTick(() => {
          const c = this.$refs.analytics
          if (c && typeof c.loadAnalytics === 'function') c.loadAnalytics()
        })
      }
      if (page === 'orders') {
        this.$nextTick(() => {
          const c = this.$refs.ordersList
          if (c && typeof c.loadOrders === 'function') c.loadOrders()
        })
      }
      if (page === 'users') {
        this.$nextTick(() => {
          const c = this.$refs['users-list']
          if (c && typeof c.loadUsers === 'function') c.loadUsers()
        })
      }
      if (page === 'messages') {
        this.selectedMessage = null
        const url = new URL(window.location.href)
        url.searchParams.delete('id')
        history.pushState({}, '', url.toString())
        this.getMessages()
      }
      if (page === 'message') {
        const urlParams = new URLSearchParams(window.location.search)
        const messageId = urlParams.get('id')
        if (messageId) {
          const find = () => this.messages.find(m => m.id == messageId)
          if (this.messages && this.messages.length > 0) {
            const msg = find()
            if (msg) this.selectedMessage = msg
          } else {
            this.getMessages().then(() => {
              const msg = find()
              if (msg) this.selectedMessage = msg
            })
          }
          const url = new URL(window.location.href)
          url.searchParams.set('page', 'message')
          url.searchParams.set('id', messageId)
          history.pushState({}, '', url.toString())
        } else if (this.selectedMessage) {
          const url = new URL(window.location.href)
          url.searchParams.set('page', 'message')
          url.searchParams.set('id', this.selectedMessage.id)
          history.pushState({}, '', url.toString())
        }
      }
      if (page === 'message-reply') {
        const urlParams = new URLSearchParams(window.location.search)
        const messageId = urlParams.get('id')
        if (messageId) {
          const find = () => this.messages.find(m => m.id == messageId)
          if (this.messages && this.messages.length > 0) {
            const msg = find()
            if (msg) this.selectedMessage = msg
          } else {
            this.getMessages().then(() => {
              const msg = find()
              if (msg) this.selectedMessage = msg
            })
          }
          const url = new URL(window.location.href)
          url.searchParams.set('page', 'message-reply')
          url.searchParams.set('id', messageId)
          history.pushState({}, '', url.toString())
        } else if (this.selectedMessage) {
          const url = new URL(window.location.href)
          url.searchParams.set('page', 'message-reply')
          url.searchParams.set('id', this.selectedMessage.id)
          history.pushState({}, '', url.toString())
        }
      }

      const url = new URL(window.location.href)
      url.searchParams.set('page', page)
      if (page !== 'message' || !url.searchParams.get('id')) {
        url.searchParams.delete('id')
      }
      history.pushState({}, '', url.toString())
      window.scrollTo(0, 0)
      document.body.style.overflow = 'hidden'

      setTimeout(() => {
        const loader = document.getElementById('block_loader')
        if (loader) {
          document.body.style.overflow = 'auto'
          loader.style.display = 'none'
        }
      }, 800)
    },
    toggleMobileMenu() {
      this.$root.mobileMenuOpen = !this.$root.mobileMenuOpen
    },
    closeMobileMenu() {
      this.$root.mobileMenuOpen = false
    },
  }
}
