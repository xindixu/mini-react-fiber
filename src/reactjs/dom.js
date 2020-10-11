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

export { createElement, createDom, updateDom };
