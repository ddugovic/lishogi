import { type VNode, h } from 'snabbdom';

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
