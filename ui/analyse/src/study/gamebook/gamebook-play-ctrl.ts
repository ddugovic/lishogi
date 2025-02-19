import { ops as treeOps, path as treePath } from 'tree';
import { makeShapesFromUsi } from '../../auto-shape';
import type AnalyseCtrl from '../../ctrl';

export type Feedback = 'play' | 'good' | 'bad' | 'end';

export interface State {
  feedback: Feedback;
  comment?: string;
  hint?: string;
  showHint: boolean;
  init: boolean; // on root path
}

export default class GamebookPlayCtrl {
  state: State;

  constructor(
    readonly root: AnalyseCtrl,
    readonly chapterId: string,
    readonly redraw: () => void,
  ) {
    // ensure all original nodes have a gamebook entry,
    // so we can differentiate original nodes from user-made ones
    treeOps.updateAll(root.tree.root, n => {
      n.gamebook = n.gamebook || {};
      if (n.shapes) n.gamebook.shapes = n.shapes.slice(0);
    });

    this.makeState();
  }

  private makeState = (): void => {
    const node = this.root.node;
    const nodeComment = (node.comments || [])[0];
    const state: Partial<State> = {
      init: this.root.path === '',
      comment: nodeComment ? nodeComment.text : undefined,
      showHint: false,
    };
    const parPath = treePath.init(this.root.path);
    const parNode = this.root.tree.nodeAtPath(parPath);
    if (!this.root.onMainline && !this.root.tree.pathIsMainline(parPath)) return;
    if (this.root.onMainline && !node.children[0]) {
      state.feedback = 'end';
    } else if (this.isMyMove()) {
      state.feedback = 'play';
      state.hint = node.gamebook?.hint;
    } else if (this.root.onMainline) {
      state.feedback = 'good';
    } else {
      state.feedback = 'bad';
      if (!state.comment) {
        state.comment = parNode.children[0].gamebook!.deviation;
      }
    }
    this.state = state as State;
    if (!state.comment) {
      if (state.feedback === 'good') setTimeout(this.next, this.root.path ? 1000 : 300);
      else if (state.feedback === 'bad') setTimeout(this.retry, 800);
    }
  };

  isMyMove = (): boolean => this.root.turnColor() === this.root.data.orientation;

  retry = (): void => {
    let path = this.root.path;
    while (path && !this.root.tree.pathIsMainline(path)) path = treePath.init(path);
    this.root.userJump(path);
    this.redraw();
  };

  next = (): void => {
    if (!this.isMyMove()) {
      const child = this.root.node.children[0];
      if (child) this.root.userJump(this.root.path + child.id);
    }
    this.redraw();
  };

  onSpace = (): void => {
    switch (this.state.feedback) {
      case 'bad':
        this.retry();
        break;
      case 'end': {
        const s = this.root.study!;
        const c = s.nextChapter();
        if (c) s.setChapter(c.id);
        break;
      }
      default:
        this.next();
    }
  };

  onPremoveSet = (): void => {
    this.next();
  };

  hint = (): void => {
    if (this.state.hint) this.state.showHint = !this.state.showHint;
  };

  solution = (): void => {
    this.root.shogiground.setShapes(
      makeShapesFromUsi(this.root.turnColor(), this.root.node.children[0].usi!, 'engine'),
    );
  };

  canJumpTo = (path: Tree.Path): boolean => treePath.contains(this.root.path, path);

  onJump = (): void => {
    this.makeState();
    // wait for the root ctrl to make the move
    setTimeout(() => this.root.shogiground.playPremove(), 100);
  };

  onShapeChange = (shapes: Tree.Shape[]): void => {
    const node = this.root.node;
    if (node.gamebook?.shapes && !shapes.length) {
      node.shapes = node.gamebook.shapes.slice(0);
      this.root.jump(this.root.path);
    }
  };
}
