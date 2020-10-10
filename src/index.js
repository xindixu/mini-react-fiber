import React from "./reactjs";

const ReactDOM = React;

class ClassComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      age: 18,
    };
  }

  handleClick = () => {
    this.setState({ age: this.state.age + 1 });
  };

  render() {
    return (
      <div>
        <h1>
          {this.props.title} {this.state.age}
        </h1>
        <button onClick={this.handleClick}>Add</button>
      </div>
    );
  }
}
ClassComponent = React.useComponent(ClassComponent);

const FunctionalComponent = ({ title }) => {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <h1>
        {title} {count}
      </h1>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
};

const element = (
  <div>
    <FunctionalComponent title="Functional Component" />
    <ClassComponent title="Class Component" />
  </div>
);

ReactDOM.render(element, document.getElementById("root"));
