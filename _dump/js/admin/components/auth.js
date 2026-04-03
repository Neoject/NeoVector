export const Auth = {
  data() {
    return {
      loginData: { username: '', password: '', remember: false },
      registerData: { username: '', password: '', role: 'user' },
      registerLoading: false,
      registerError: '',
      registerSuccess: '',
      loginError: '',
      loginLoading: false,
      showLogin: false,
      showProfileModal: false,
      profileForm: { username: '', role: '', created_at: '' },
      profileLoading: false,
      profileError: '',
      profileSuccess: '',
      passwordForm: { current_password: '', new_password: '', confirm_password: '' },
      passwordLoading: false,
      passwordError: '',
      passwordSuccess: '',
    }
  },
  computed: {
    isAuthenticated() {
      const adminAuth = window.__ADMIN_AUTH__
      return !!(adminAuth && adminAuth.authenticated === true && adminAuth.role === 'admin')
    },
  },
  methods: {
    openLogin() {},
    closeLogin() {},
    doLogin() {},
    async register() {
      this.loginError = ''
      this.registerError = ''
      this.registerSuccess = ''
      try {
        const u = (this.registerData.username || '').trim()
        const p = (this.registerData.password || '').trim()
        if (!u || !p) throw new Error('Введите логин и пароль')
        if (u.length > 50) throw new Error('Слишком длинное имя пользователя')
        this.registerLoading = true
        const formData = new FormData()
        formData.append('action', 'register')
        formData.append('username', u)
        formData.append('password', p)
        formData.append('role', this.registerData.role || 'user')
        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok || !data.success) throw new Error(data.error || 'Ошибка регистрации')
        this.registerData = { username: '', password: '', role: 'user' }
        this.registerSuccess = 'Пользователь создан успешно'
        setTimeout(() => { this.showAddUser = false; this.registerSuccess = '' }, 800)
      } catch (error) {
        this.registerError = error.message || 'Ошибка регистрации'
      }
      this.registerLoading = false
    },
    openProfileModal() {
      this.showProfileModal = true
      this.profileError = ''
      this.profileSuccess = ''
      this.passwordError = ''
      this.passwordSuccess = ''
      this.loadProfile().then(r => null)
    },
    closeProfileModal() {
      this.showProfileModal = false
      this.profileForm = { username: '', role: '', created_at: '' }
      this.passwordForm = { current_password: '', new_password: '', confirm_password: '' }
      this.profileError = ''
      this.profileSuccess = ''
      this.passwordError = ''
      this.passwordSuccess = ''
    },
    async loadProfile() {
      try {
        const response = await fetch('../api.php?action=get_profile', { credentials: 'same-origin' })
        const data = await response.json()
        if (response.ok && data.success) {
          this.profileForm = { username: data.user.username || '', role: data.user.role || '', created_at: data.user.created_at || '' }
        } else {
          this.profileError = data.error || 'Ошибка загрузки профиля'
        }
      } catch (error) {
        this.profileError = 'Ошибка загрузки профиля: ' + error.message
      }
    },
    async updateProfile() {
      this.profileError = ''
      this.profileSuccess = ''
      try {
        const username = (this.profileForm.username || '').trim()
        if (!username) throw new Error('Имя пользователя не может быть пустым')
        if (username.length > 50) throw new Error('Имя пользователя слишком длинное')
        this.profileLoading = true
        const formData = new FormData()
        formData.append('action', 'update_profile')
        formData.append('username', username)
        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok || !data.success) throw new Error(data.error || 'Ошибка обновления профиля')
        this.profileSuccess = 'Профиль успешно обновлен'
        if (typeof NV !== 'undefined' && NV.getAuth && NV.setAuth) {
          const auth = NV.getAuth(); auth.username = username; NV.setAuth(auth)
        }
        setTimeout(() => { this.profileSuccess = '' }, 3000)
      } catch (error) {
        this.profileError = error.message || 'Ошибка обновления профиля'
      } finally {
        this.profileLoading = false
      }
    },
    async changePassword() {
      this.passwordError = ''
      this.passwordSuccess = ''
      try {
        const cp = (this.passwordForm.current_password || '').trim()
        const np = (this.passwordForm.new_password || '').trim()
        const cnp = (this.passwordForm.confirm_password || '').trim()
        if (!cp || !np || !cnp) throw new Error('Все поля обязательны для заполнения')
        if (np.length < 6) throw new Error('Новый пароль должен содержать минимум 6 символов')
        if (np !== cnp) throw new Error('Новый пароль и подтверждение не совпадают')
        this.passwordLoading = true
        const formData = new FormData()
        formData.append('action', 'change_password')
        formData.append('current_password', cp)
        formData.append('new_password', np)
        formData.append('confirm_password', cnp)
        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' })
        const data = await response.json()
        if (!response.ok || !data.success) throw new Error(data.error || 'Ошибка смены пароля')
        this.passwordSuccess = 'Пароль успешно изменен'
        this.passwordForm = { current_password: '', new_password: '', confirm_password: '' }
        setTimeout(() => { this.passwordSuccess = '' }, 3000)
      } catch (error) {
        this.passwordError = error.message || 'Ошибка смены пароля'
      } finally {
        this.passwordLoading = false
      }
    },
  },
}
