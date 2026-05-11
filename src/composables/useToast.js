import { reactive } from 'vue';

export function useToast() {
  const toast = reactive({ show: false, title: '' });
  let timer = null;

  const showToast = (title, duration = 1500) => {
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
