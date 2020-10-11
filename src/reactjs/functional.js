const w = window;

function useState(init) {
  const oldHook =
    w.wipFiber.base &&
    w.wipFiber.base.hooks &&
    w.wipFiber.base.hooks[w.hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : init,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];

  actions.forEach((action) => {
    hook.state = action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    w.wipRoot = {
      dom: w.currentRoot.dom,
      props: w.currentRoot.props,
      base: w.currentRoot,
    };
    w.nextUnitOfWork = w.wipRoot;
    w.deletions = [];
  };

  w.wipFiber.hooks.push(hook);
  w.hookIndex += 1;
  return [hook.state, setState];
}

export { useState };
