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
  container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`;
}

export default { createElement, render };
