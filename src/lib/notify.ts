import Swal, { SweetAlertOptions } from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

function getThemeOptions(): Partial<SweetAlertOptions> {
  const dark = isDarkMode()
  return {
    background: dark ? '#1f2937' : '#ffffff',
    color: dark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#6b7280',
    customClass: {
      popup: 'rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl font-sans',
      title: 'text-lg font-bold text-gray-900 dark:text-gray-100',
      htmlContainer: 'text-sm text-gray-600 dark:text-gray-300',
      confirmButton: 'px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all focus:ring-2 focus:ring-offset-2',
      cancelButton: 'px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all focus:ring-2 focus:ring-offset-2',
    }
  }
}

export const notify = {
  success(message: string, title: string = 'Berhasil') {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer: 3500,
      timerProgressBar: true,
      ...getThemeOptions(),
    })
  },

  error(message: string, title: string = 'Terjadi Kesalahan') {
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      ...getThemeOptions(),
    })
  },

  warning(message: string, title: string = 'Peringatan') {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      ...getThemeOptions(),
    })
  },

  info(message: string, title: string = 'Informasi') {
    return Swal.fire({
      icon: 'info',
      title,
      text: message,
      ...getThemeOptions(),
    })
  },

  toast(message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const dark = isDarkMode()
    return Swal.fire({
      text: message,
      icon,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: dark ? '#1f2937' : '#ffffff',
      color: dark ? '#f9fafb' : '#111827',
      customClass: {
        popup: 'rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg text-sm font-sans',
      }
    })
  },

  async confirm(options: {
    title: string
    text: string
    confirmButtonText?: string
    cancelButtonText?: string
    isDanger?: boolean
  }): Promise<boolean> {
    const dark = isDarkMode()
    const result = await Swal.fire({
      title: options.title,
      text: options.text,
      icon: options.isDanger ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Ya, Lanjutkan',
      cancelButtonText: options.cancelButtonText || 'Batal',
      confirmButtonColor: options.isDanger ? '#ef4444' : '#6366f1',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      ...getThemeOptions(),
    })
    return result.isConfirmed
  },

  async prompt(options: {
    title: string
    text?: string
    inputPlaceholder?: string
    inputValue?: string
    confirmButtonText?: string
    cancelButtonText?: string
  }): Promise<string | null> {
    const result = await Swal.fire({
      title: options.title,
      text: options.text,
      input: 'text',
      inputPlaceholder: options.inputPlaceholder,
      inputValue: options.inputValue || '',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Simpan',
      cancelButtonText: options.cancelButtonText || 'Batal',
      ...getThemeOptions(),
    })
    if (result.isConfirmed && typeof result.value === 'string') {
      return result.value
    }
    return null
  },

  loading(title: string = 'Memproses...', text: string = 'Mohon tunggu sebentar') {
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      },
      ...getThemeOptions(),
    })
  },

  close() {
    Swal.close()
  }
}

export default notify

