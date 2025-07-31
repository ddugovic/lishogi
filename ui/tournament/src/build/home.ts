window.lishogi.ready.then(() => {
  // so that we can get infinite looking marquee
  document.querySelectorAll('.tour-winners').forEach(el => {
    el.innerHTML += el.innerHTML;
  });
});
