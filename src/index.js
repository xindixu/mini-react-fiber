import React from "./reactjs/index";

const ReactDOM = React;

const App = ({ title }) => (
  <div>
    <h1>{title}</h1>
    <p>A paragraph</p>
    <a href="www.google.com">Google</a>
  </div>
);

const element = <App title="Hello" />;

ReactDOM.render(element, document.getElementById("root"));
