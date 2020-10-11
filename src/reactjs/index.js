/* eslint-disable no-use-before-define */
/* eslint-disable  react-hooks/rules-of-hooks */
import { updateDom, createElement } from "./dom";
import { performUnitOfWork } from "./fiber";

// // `render` will initiate first task
// let nextUnitOfWork = null;
// let wipRoot = null;
// // current root that got interrupted
// let currentRoot = null;
// let deletions = null;
// const wipFiber = null;
// let hookIndex = null;

const w = window;
w.nextUnitOfWork = null;
w.wipRoot = null;
w.currentRoot = null;
w.deletions = null;
w.wipFiber = null;
w.hookIndex = null;

function commitRoot() {
  w.deletions.forEach(commitWork);
  commitWork(w.wipRoot.child);
  // cancel wip
  w.currentRoot = w.wipRoot;
  w.wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  // function component doesn't have dom
  // look for dom up in the tree recursively
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && !!fiber.dom) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && !!fiber.dom) {
    updateDom(fiber.dom, fiber.base.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function render(vdom, container) {
  w.wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    },
    base: w.currentRoot,
  };
  w.deletions = [];
  w.nextUnitOfWork = w.wipRoot;
}

// manage `diff` tasks
function workLoop(deadline) {
  // current tick hasn't ended
  // didn't consider deadline.didTimeout
  while (w.nextUnitOfWork && deadline.timeRemaining() > 1) {
    w.nextUnitOfWork = performUnitOfWork(w.nextUnitOfWork);
  }

  if (!w.nextUnitOfWork && w.wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

// ref: https://developer.mozilla.org/en-US/docs/Web/API/w/requestIdleCallback
// Process tasks when the event loop is idle
requestIdleCallback(workLoop);

function useState(init) {
  const oldHook =
    w.wipFiber.base &&
    w.wipFiber.base.hooks &&
    w.wipFiber.base.hooks[w.hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : init,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];

  actions.forEach((action) => {
    hook.state = action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    w.wipRoot = {
      dom: w.currentRoot.dom,
      props: w.currentRoot.props,
      base: w.currentRoot,
    };
    w.nextUnitOfWork = w.wipRoot;
    w.deletions = [];
  };

  w.wipFiber.hooks.push(hook);
  w.hookIndex += 1;
  return [hook.state, setState];
}

class Component {
  constructor(props) {
    this.props = props;
  }
}

function useComponent(Component) {
  return function (props) {
    const component = new Component(props);
    const [state, setState] = useState(component.state);
    component.props = props;
    component.state = state;
    component.setState = setState;
    return component.render();
  };
}

export default {
  createElement,
  render,
  useState,
  Component,
  useComponent,
};
