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

function commitRoot() {
  commitWorker(wipRoot.child);
  wipRoot = null;
}

function commitWorker(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWorker(fiber.child);
  commitWorker(fiber.sibling);
}

// `render` will initiate first task
let nextUnitOfWork = null;
let wipRoot = null;

// manger `diff` tasks
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

/*
 * fiber:
 * Parent -> First child
 * Any child -> Parent
 * First child -> second child -> third child
 */

function performUnitOfWork(fiber) {
  // get next task

  if (!fiber.dom) {
    fiber.dom = creatDom(fiber);
  }
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  const elements = fiber.props.children;
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
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.prevSibling = newFiber;
    }
    index += 1;
    prevSibling = fiber;

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
      nextFiber = newFiber.parent;
    }
  }
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
  };
  nextUnitOfWork = wipRoot;
  // container.appendChild(dom);
}

function creatDom(vdom) {
  const dom =
    vdom.type === "text"
      ? document.createTextNode(vdom.nodeValue)
      : document.createElement(vdom.type);

  Object.keys(vdom.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      // TODO: event listeners
      dom[name] = vdom.props[name];
    });
  return dom;
}

// ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
// Process tasks when the event loop is idle
window.requestIdleCallback(workLoop);

export default { createElement, render };
