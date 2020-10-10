import React from "./reactjs/index";

const ReactDOM = React;

const App = ({ title }) => {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <h1>{title}</h1>
      <p>A paragraph</p>
      <a href="www.google.com">Google</a>
      {count}
      <button onClick={() => setCount(count + 1)}>add</button>
    </div>
  );
};

const element = <App title="Hello" />;

ReactDOM.render(element, document.getElementById("root"));
