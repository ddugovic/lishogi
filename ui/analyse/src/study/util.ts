import { h, type VNode } from 'snabbdom';

export function formButton(name: string): VNode {
  return h(
    'div.form-actions.full',
    h(
      'button.button',
      {
        attrs: { type: 'submit' },
      },
      name,
    ),
  );
}
