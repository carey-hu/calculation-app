/**
 * Toast 提示
 */

import { ref } from 'vue'

export function useToast() {
  const show = ref(false)
  const message = ref('')
  
  let timeoutId = null
  
  function showToast(msg, duration = 1500) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    message.value = msg
    show.value = true
    
    timeoutId = setTimeout(() => {
      show.value = false
      timeoutId = null
    }, duration)
  }
  
  function hideToast() {
    show.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return {
    show,
    message,
    showToast,
    hideToast
  }
}
