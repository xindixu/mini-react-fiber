/* eslint-disable  react-hooks/rules-of-hooks */
import { useState } from "./functional";

class Component {
  constructor(props) {
    this.props = props;
  }
}

function useComponent(Component) {
  return function (props) {
    const component = new Component(props);
    const [state, setState] = useState(component.state);
    component.props = props;
    component.state = state;
    component.setState = setState;
    return component.render();
  };
}

export { useComponent, Component };
