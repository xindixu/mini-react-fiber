// import React from "./reactjs/index";
import React from "./reactjs/copy";

const ReactDOM = React;

const App = ({ title }) => {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <h1>
        {title} {count}
      </h1>
      <p>A paragraph</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
};

const element = <App title="Hello" />;

ReactDOM.render(element, document.getElementById("root"));
