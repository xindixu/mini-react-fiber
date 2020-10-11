/* eslint-disable no-use-before-define */
import { createElement } from "./dom";
import { performUnitOfWork } from "./fiber";
import { commitRoot } from "./commit";
import { useState } from "./functional";
import { Component, useComponent } from "./class";

const w = window;
// `render` will initiate first task
w.nextUnitOfWork = null;
w.wipRoot = null;
// root that got interrupted
w.currentRoot = null;
w.deletions = null;
// functional components related
w.wipFiber = null;
w.hookIndex = null;

function render(vdom, container) {
  w.wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    },
    base: w.currentRoot,
  };
  w.deletions = [];
  w.nextUnitOfWork = w.wipRoot;
}

// manage `diff` tasks
function workLoop(deadline) {
  // current tick hasn't ended
  // didn't consider deadline.didTimeout
  while (w.nextUnitOfWork && deadline.timeRemaining() > 1) {
    w.nextUnitOfWork = performUnitOfWork(w.nextUnitOfWork);
  }

  if (!w.nextUnitOfWork && w.wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

// ref: https://developer.mozilla.org/en-US/docs/Web/API/w/requestIdleCallback
// Process tasks when the event loop is idle
requestIdleCallback(workLoop);

export default {
  createElement,
  render,
  useState,
  Component,
  useComponent,
};
