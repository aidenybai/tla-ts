// A renderer of React's reconciler whose host instances are plain objects: an element is its type,
// props and children, and a text its text.
import Reconciler from "react-reconciler";

// The reconciler's DefaultEventPriority, at which an update outside React's events renders through
// the scheduler.
const DEFAULT_EVENT_PRIORITY = 32;

let priority = 0;
const renderer = Reconciler({
  supportsMutation: true,
  isPrimaryRenderer: true,
  noTimeout: -1,
  supportsMicrotasks: true,
  scheduleMicrotask: queueMicrotask,
  createInstance: (type, props) => ({ type, props, children: [] }),
  createTextInstance: (text) => ({ text }),
  appendInitialChild: (parent, child) => {
    parent.children.push(child);
  },
  appendChild: (parent, child) => {
    parent.children.push(child);
  },
  appendChildToContainer: (container, child) => {
    container.children.push(child);
  },
  insertBefore: (parent, child, before) => {
    parent.children.splice(parent.children.indexOf(before), 0, child);
  },
  insertInContainerBefore: (container, child, before) => {
    container.children.splice(container.children.indexOf(before), 0, child);
  },
  removeChild: (parent, child) => {
    parent.children.splice(parent.children.indexOf(child), 1);
  },
  removeChildFromContainer: (container, child) => {
    container.children.splice(container.children.indexOf(child), 1);
  },
  commitTextUpdate: (instance, oldText, newText) => {
    instance.text = newText;
  },
  commitUpdate: (instance, type, oldProps, newProps) => {
    instance.props = newProps;
  },
  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  getRootHostContext: () => ({}),
  getChildHostContext: (context) => context,
  getPublicInstance: (instance) => instance,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  clearContainer: (container) => {
    container.children.length = 0;
  },
  detachDeletedInstance: () => {},
  setCurrentUpdatePriority: (next) => {
    priority = next;
  },
  getCurrentUpdatePriority: () => priority,
  resolveUpdatePriority: () => priority || DEFAULT_EVENT_PRIORITY,
  maySuspendCommit: () => false,
  shouldAttemptEagerTransition: () => false,
  trackSchedulerEvent: () => {},
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1.1,
  requestPostPaintCallback: () => {},
  NotPendingTransition: null,
  resetFormInstance: () => {},
});

const getText = (node) =>
  typeof node.text === "string" ? node.text : node.children.map(getText).join("");

// Renders an element into a container of its own, and gives the text of what it rendered.
export const render = (element) => {
  const container = { children: [] };
  const root = renderer.createContainer(
    container,
    0,
    null,
    false,
    null,
    "",
    () => {},
    () => {},
    () => {},
    null,
  );
  renderer.updateContainer(element, root, null, null);
  return () => container.children.map(getText).join("");
};
