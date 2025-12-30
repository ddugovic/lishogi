// preload so that highligh animations can play right away
setTimeout(() => {
  $('#top .dasher .toggle').trigger('mouseover');
}, 500);

// dasher preferences
$(".row[href='']").on('click', e => {
  e.stopPropagation();
  e.preventDefault();
  $('.dasher > a').trigger('click');
  window.scrollTo(0, 0);
  setTimeout(triggerHighlights, 500);
});

function triggerHighlights() {
  const allSubs = document.querySelectorAll<HTMLElement>('.subs .sub');
  const subs = Array.from(allSubs).slice(-3);

  subs.forEach((el, i) => {
    const className = `highlight-${i + 1}`;

    if (!el.classList.contains(className)) {
      el.classList.add(className);
    }
  });
}
