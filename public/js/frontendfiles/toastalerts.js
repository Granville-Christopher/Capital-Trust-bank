const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const toastIcon = document.getElementById('toast-icon');

function showToast(message, type = 'info', duration = 3000) {
  toastText.textContent = message;
  toast.classList.remove('opacity-0', 'pointer-events-none');

  toastIcon.className = 'fas';
  switch(type) {
    case 'success':
      toastIcon.classList.add('fa-check-circle', 'text-green-500');
      break;
    case 'error':
      toastIcon.classList.add('fa-exclamation-circle', 'text-red-500');
      break;
    case 'warning':
      toastIcon.classList.add('fa-exclamation-triangle', 'text-yellow-400');
      break;
    default:
      toastIcon.classList.add('fa-info-circle', 'text-blue-500');
  }

  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, duration);
}

export { showToast };
