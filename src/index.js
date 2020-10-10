import React from "./reactjs/index";

const ReactDOM = React;

const element = (
  <div>
    <h1>Hello world</h1>
    <p>A paragraph</p>
    <a href="www.google.com">Google</a>
  </div>
);

ReactDOM.render(element, document.getElementById("root"));
