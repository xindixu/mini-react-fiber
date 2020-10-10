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
  // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`;

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

  vdom.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
}

export default { createElement, render };
