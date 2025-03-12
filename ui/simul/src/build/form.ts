window.lishogi.ready.then(() => {
  document.querySelectorAll('main form .flatpickr').forEach(el => {
    window.flatpickr(el, {
      minDate: Date.now(),
      maxDate: new Date(Date.now() + 1000 * 3600 * 24 * 31 * 3),
      dateFormat: 'Z',
      altInput: true,
      altFormat: 'Y-m-d h:i K',
      enableTime: true,
      time_24hr: true,
      disableMobile: true,
      locale: document.documentElement.lang as any,
    });
  });

  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    "div.variants input[type='checkbox']",
  );
  const posWrap = document.querySelector<HTMLInputElement>('.form-group.position')!;
  const posInput = posWrap.querySelector<HTMLInputElement>('input')!;
  const updateTextInputState = () => {
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const moreThanOne = checkedCount > 1;
    posWrap.classList.toggle('disabled', moreThanOne);
    if (moreThanOne) posInput.value = '';
  };

  checkboxes.forEach(cb => cb.addEventListener('change', updateTextInputState));
  updateTextInputState();
});
