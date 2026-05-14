import { reactive } from 'vue';

interface ToastState {
  show: boolean;
  title: string;
}

export function useToast() {
  const toast: ToastState = reactive({ show: false, title: '' });
  let timer: ReturnType<typeof setTimeout> | null = null;

  const showToast = (title: string, duration = 1500) => {
    toast.title = title;
    toast.show = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      toast.show = false;
      timer = null;
    }, duration);
  };

  return { toast, showToast };
}
