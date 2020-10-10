/* eslint-disable no-use-before-define */
function createTextElement(text) {
  return {
    type: "text",
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

function render(vdom, container) {
  // const dom =
  //   vdom.type === "text"
  //     ? document.createTextNode(vdom.nodeValue)
  //     : document.createElement(vdom.type);

  // Object.keys(vdom.props)
  //   .filter((key) => key !== "children")
  //   .forEach((name) => {
  //     // TODO: event listeners
  //     dom[name] = vdom.props[name];
  //   });

  // When num of children gets big, this will cause issue since we cannot pause this loop.
  // vdom.props.children.forEach((child) => {
  //   render(child, dom);
  // });

  wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    },
    base: currentRoot, // previous root
  };
  nextUnitOfWork = wipRoot;
  // container.appendChild(dom);
}

function creatDom(vdom) {
  const dom =
    vdom.type === "text"
      ? document.createTextNode(vdom.nodeValue)
      : document.createElement(vdom.type);
  updateDom(dom, {}, vdom.props);
  return dom;
}

function updateDom(dom, prevProps, nextProps) {
  // filter out children props
  // if old exists, cancel
  // if new, update

  Object.keys(prevProps)
    .filter((name) => name !== "children")
    .filter((name) => !(name in nextProps))
    .forEach((name) => {
      if (name.slice(0, 2) === "on") {
        dom.removeEventListener(
          name.slice(0, 2).toLowerCase(),
          prevProps[name],
          false
        );
      } else {
        dom[name] = "";
      }
    });

  Object.keys(nextProps)
    .filter((name) => name !== "children")
    .forEach((name) => {
      if (name.slice(0, 2) === "on") {
        dom.addEventListener(
          name.slice(0, 2).toLowerCase(),
          prevProps[name],
          false
        );
      } else {
        dom[name] = "";
      }
    });
}
// `render` will initiate first task
let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
const deletions = [];

function commitRoot() {
  deletions.forEach(commitWorker);
  commitWorker(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function commitWorker(fiber) {
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

  if (fiber.effectTag === "REPLACE" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETE") {
    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.base.props, fiber.props);
  }
  // domParent.appendChild(fiber.dom);
  commitWorker(fiber.child);
  commitWorker(fiber.sibling);
}

// manage `diff` tasks
function workLoop(deadline) {
  // current tick hasn't ended
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  window.requestIdleCallback(workLoop);
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = creatDom(fiber);
  }
  // Real dom manipulation
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom);
  // }
  const elements = fiber.props.children;

  reconcileChildren(fiber, elements);
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
  // get next task

  // find next unit of work
  // 1. child
  // 2. sibling
  // 3. parent
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

function reconcileChildren(wipFiber, elements) {
  // construct fiber from vdom

  /*
   * fiber = {
   *  dom,
   *  parent,
   *  child,
   *  siblings
   * }
   */

  let index = 0;
  let oldFiber = wipFiber.base && wipFiber.base.child;
  let prevSibling = null;

  while (index < elements.length && oldFiber !== null) {
    const element = elements[index];
    let newFiber = null;

    // compare old and new fiber
    const sameType = oldFiber && element && oldFiber.type === element.type;
    if (sameType) {
      // reuse node, update
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        base: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (!sameType && element) {
      // replace with new node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        base: null,
        effectTag: "REPLACE",
      };
    }
    if (!sameType && oldFiber) {
      // delete old node
      oldFiber.effectTag = "DELETE";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.prevSibling = newFiber;
    }
    prevSibling = newFiber;
    index += 1;
  }
}

// ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
// Process tasks when the event loop is idle
window.requestIdleCallback(workLoop);

export default { createElement, render };
