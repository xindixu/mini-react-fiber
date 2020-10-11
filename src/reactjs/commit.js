/* eslint-disable no-use-before-define */
import { updateDom } from "./dom";

const w = window;
function commitRoot() {
  w.deletions.forEach(commitWork);
  commitWork(w.wipRoot.child);
  // cancel wip
  w.currentRoot = w.wipRoot;
  w.wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  // function component doesn't have dom
  // look for dom up in the tree recursively
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && !!fiber.dom) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && !!fiber.dom) {
    updateDom(fiber.dom, fiber.base.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

export { commitRoot, commitDeletion, commitWork };
