import { richHTML } from 'common/rich-text';
import { bind, onInsert } from 'common/snabbdom';
import { type VNode, h } from 'snabbdom';
import type { StudyCtrl } from './interfaces';

type Save = (t: string) => void;

export class DescriptionCtrl {
  edit = false;

  constructor(
    public text: string | undefined,
    readonly doSave: Save,
    readonly redraw: () => void,
  ) {}

  save(t: string): void {
    this.text = t;
    this.doSave(t);
    this.redraw();
  }

  set(t: string | undefined): void {
    this.text = t ? t : undefined;
  }
}

function descTitle(chapter: boolean) {
  return `${chapter ? 'Chapter' : 'Study'} pinned comment`;
}

export function view(study: StudyCtrl, chapter: boolean): VNode | undefined {
  const desc = chapter ? study.chapterDesc : study.studyDesc;
  const contrib = study.members.canContribute() && !study.gamebookPlay();
  if (desc.edit) return edit(desc, chapter ? study.data.chapter.id : study.data.id, chapter);
  const isEmpty = desc.text === '-';
  if (!desc.text || (isEmpty && !contrib)) return;
  return h(`div.study-desc${chapter ? '.chapter-desc' : ''}${isEmpty ? '.empty' : ''}`, [
    contrib && !isEmpty
      ? h('div.contrib', [
          h('span', descTitle(chapter)),
          isEmpty
            ? null
            : h('a', {
                attrs: {
                  'data-icon': 'm',
                  title: 'Edit',
                },
                hook: bind(
                  'click',
                  _ => {
                    desc.edit = true;
                  },
                  desc.redraw,
                ),
              }),
          h('a', {
            attrs: {
              'data-icon': 'q',
              title: 'Delete',
            },
            hook: bind('click', () => {
              if (confirm('Delete permanent description?')) desc.save('');
            }),
          }),
        ])
      : null,
    isEmpty
      ? h(
          'a.text.button',
          {
            hook: bind(
              'click',
              _ => {
                desc.edit = true;
              },
              desc.redraw,
            ),
          },
          descTitle(chapter),
        )
      : h('div.text', { hook: richHTML(desc.text) }),
  ]);
}

function edit(ctrl: DescriptionCtrl, id: string, chapter: boolean): VNode {
  return h('div.study-desc-form', [
    h('div.title', [
      descTitle(chapter),
      h('button.button.button-empty.button-red', {
        attrs: {
          'data-icon': 'L',
          title: 'Close',
        },
        hook: bind(
          'click',
          () => {
            ctrl.edit = false;
          },
          ctrl.redraw,
        ),
      }),
    ]),
    h('form.form3', [
      h('div.form-group', [
        h(`textarea#form-control.desc-text.${id}`, {
          hook: onInsert<HTMLInputElement>(el => {
            el.value = ctrl.text === '-' ? '' : ctrl.text || '';
            el.onkeyup = el.onpaste = () => {
              ctrl.save(el.value.trim());
            };
            el.focus();
          }),
        }),
      ]),
    ]),
  ]);
}
