const w = window;

function reconcileChildren(fiber, elements) {
  // construct fiber from vdom

  let index = 0;
  let oldFiber = fiber.base && fiber.base.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // compare old and new fiber
    const sameType = oldFiber && element && oldFiber.type === element.type;
    if (sameType) {
      // reuse node, update
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: fiber,
        base: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (!sameType && element) {
      // replace with new node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: fiber,
        base: null,
        effectTag: "PLACEMENT",
      };
    }
    if (!sameType && oldFiber) {
      // delete old node
      oldFiber.effectTag = "DELETION";
      w.deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index += 1;
  }
}

export { reconcileChildren };
