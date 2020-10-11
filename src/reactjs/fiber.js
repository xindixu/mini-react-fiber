import { reconcileChildren } from "./reconcile";
import { createDom } from "./dom";

const w = window;

function updateFunctionComponent(fiber) {
  w.wipFiber = fiber;
  w.hookIndex = 0;
  w.wipFiber.hooks = [];

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

/*
 * fiber:
 * Parent -> First child
 * Any child -> Parent
 * First child -> second child -> third child
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // order of finding next unit of work
  // child -> child's sibling -> .. -> child's sibling -> parent
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

export { performUnitOfWork };
