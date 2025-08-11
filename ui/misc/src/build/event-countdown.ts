$('.event .countdown').each(function () {
  const $el = $(this);
  const seconds = Number.parseInt($(this).data('seconds')) - 1;
  const target = Date.now() + seconds * 1000;

  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  let interval: number | undefined;

  const redraw = () => {
    const distance = target - Date.now();

    if (distance > 0) {
      $el.find('.days').text(Math.floor(distance / day));
      $el.find('.hours').text(Math.floor((distance % day) / hour));
      $el.find('.minutes').text(Math.floor((distance % hour) / minute));
      $el.find('.seconds').text(Math.floor((distance % minute) / second));
    } else {
      clearInterval(interval);
      window.lishogi.reload();
    }
  };
  interval = setInterval(redraw, second);

  redraw();
});
