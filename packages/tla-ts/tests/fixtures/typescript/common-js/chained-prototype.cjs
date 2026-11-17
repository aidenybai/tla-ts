// An assignment gives the prototype that a new makes and that it assigns first, as React's does.
function Component(props) {
  this.props = props;
}
Component.prototype.isReactComponent = {};
function ComponentDummy() {}
ComponentDummy.prototype = Component.prototype;
function PureComponent(props) {
  this.props = props;
}
let deprecatedAPIs = { a: 1 };
deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
deprecatedAPIs.constructor = PureComponent;
deprecatedAPIs.isPureReactComponent = true;
const made = new PureComponent(3);
const seen = [
  made.props,
  made.isPureReactComponent,
  made instanceof Component,
  made.constructor === PureComponent,
].join();
if (seen !== "3,true,true,true") throw new Error("seen " + seen);
