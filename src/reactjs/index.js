/* eslint-disable no-use-before-define */
/* eslint-disable  react-hooks/rules-of-hooks */
import { reconcileChildren } from "./reconcile";

// `render` will initiate first task
let nextUnitOfWork = null;
let wipRoot = null;
// current root that got interrupted
let currentRoot = null;
let deletions = null;
let wipFiber = null;
let hookIndex = null;

function createTextElement(text) {
  return {
    type: "TEXT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createElement(type, props, ...children) {
  delete props.__source;
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createDom(vdom) {
  const dom =
    vdom.type === "TEXT"
      ? document.createTextNode("")
      : document.createElement(vdom.type);
  updateDom(dom, {}, vdom.props);
  return dom;
}

function updateDom(dom, prevProps, nextProps) {
  // remove attributes exists
  Object.keys(prevProps)
    .filter((name) => name !== "children")
    .filter((name) => !(name in nextProps))
    .forEach((name) => {
      if (name.slice(0, 2) === "on") {
        dom.removeEventListener(
          name.slice(2).toLowerCase(),
          prevProps[name],
          false
        );
      } else {
        dom[name] = "";
      }
    });

  // add attributes
  Object.keys(nextProps)
    .filter((name) => name !== "children")
    .forEach((name) => {
      if (name.slice(0, 2) === "on") {
        dom.addEventListener(
          name.slice(2).toLowerCase(),
          nextProps[name],
          false
        );
      } else {
        dom[name] = nextProps[name];
      }
    });
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  // cancel wip
  currentRoot = wipRoot;
  wipRoot = null;
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
  wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    },
    base: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

// manage `diff` tasks
function workLoop(deadline) {
  // current tick hasn't ended
  // didn't consider deadline.didTimeout
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

// ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
// Process tasks when the event loop is idle
requestIdleCallback(workLoop);

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children, deletions);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children, deletions);
}

/*
 * fiber:
 * Parent -> First child
 * Any child -> Parent
 * First child -> second child -> third child
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // order of finding next unit of work
  // child -> child's sibling -> .. -> child's sibling -> parent
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function useState(init) {
  const oldHook =
    wipFiber.base && wipFiber.base.hooks && wipFiber.base.hooks[hookIndex];
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
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      base: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex += 1;
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

export default { createElement, render, useState, Component, useComponent };
