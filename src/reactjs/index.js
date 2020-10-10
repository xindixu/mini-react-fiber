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

  // When num of children gets big, this will cause issue since we cannot pause this loop.
  vdom.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
}

// `render` will initiate first task
let nextUnitOfWork = null;
// manger `diff` tasks
function workLoop(deadline) {
  // current tick hasn't ended
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  // get next task
}

// ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
// Process tasks when the event loop is idle
requestIdleCallback(workLoop);

export default { createElement, render };
