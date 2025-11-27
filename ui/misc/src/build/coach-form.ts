import { spinnerHtml } from 'common/spinner';
import { debounce } from 'common/timings';

window.lishogi.ready.then(() => {
  const $editor = $('.coach-edit');

  const todo = (() => {
    const $overview = $editor.find('.overview');
    const $el = $overview.find('.todo');
    const $listed = $editor.find('#form3-listed');

    const must = [
      {
        html: '<a href="/account/profile">Complete your lishogi profile</a>',
        check: () => $el.data('profile'),
      },
      {
        html: 'Upload a profile picture',
        check: () => $editor.find('img.picture').length,
      },
      {
        html: 'Fill in basic information',
        check: () => {
          for (const name of ['profile.headline', 'languages']) {
            if (!$editor.find(`[name="${name}"]`).val()) return false;
          }
          return true;
        },
      },
      {
        html: 'Fill at least 3 description texts',
        check: () =>
          $editor.find('.panel.texts textarea').filter(function () {
            return !!$(this).val();
          }).length >= 3,
      },
    ];

    return () => {
      const points: JQuery[] = [];
      for (const o of must) if (!o.check()) points.push($('<li>').html(o.html));
      $el.find('ul').empty();
      const fail = !!points.length;
      $overview.toggleClass('with-todo', fail);
      if (fail) $listed.prop('checked', false);
      $listed.prop('disabled', fail);
    };
  })();

  $editor.find('.tabs > div').on('click', function () {
    $editor.find('.tabs > div').removeClass('active');
    $(this).addClass('active');
    $editor.find('.panel').removeClass('active');
    $editor.find(`.panel.${$(this).data('tab')}`).addClass('active');
    $editor.find('div.status').removeClass('saved');
  });

  $('.coach_picture form.upload input[type=file]').on('change', function () {
    $('.picture_wrap').html(spinnerHtml);
    $(this).parents('form').trigger('submit');
  });

  const langInput = document.getElementById('form3-languages') as HTMLInputElement;
  const whitelistJson = langInput.getAttribute('data-all');
  const whitelist = whitelistJson ? (JSON.parse(whitelistJson) as Tagify.TagData[]) : undefined;
  const initialValues = langInput
    .getAttribute('data-value')
    ?.split(',')
    .map(code => whitelist?.find(l => l.code == code)?.value)
    .filter(v => !!v);
  if (initialValues) langInput.setAttribute('value', initialValues.join(','));
  new window.Tagify(langInput, {
    maxTags: 10,
    whitelist,
    enforceWhitelist: true,
    dropdown: {
      enabled: 1,
    },
  });

  const submit = debounce(() => {
    const form = document.querySelector('form.async') as HTMLFormElement;
    if (!form) return;
    window.lishogi.xhr.formToXhr(form).then(() => {
      $editor.find('div.status').addClass('saved');
      todo();
    });
  }, 1200);

  setTimeout(() => {
    $editor.find('input, textarea, select').on('input paste change keyup', () => {
      const $statusDiv = $editor.find('div.status');
      $statusDiv.removeClass('saved');
      submit();
    });
  }, 0);

  todo();
});
