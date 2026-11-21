/** @jsxRuntime classic */
/** @jsx h */
declare global {
  namespace JSX {
    type Element = string;
    interface IntrinsicElements {
      button: { pressed: boolean; children: unknown };
    }
  }
}

const h = (type: string, props: { pressed: boolean }, ...children: unknown[]) =>
  `${type}${props.pressed ? ":pressed" : ""}(${children.join("")})`;

let likes = 0;
let isLiked = false;

export const toggle = () => {
  isLiked = !isLiked;
  likes += isLiked ? 1 : -1;
};

export const fail = () => {
  likes -= 1;
};

const getView = () => (
  <button pressed={isLiked}>
    {likes} {likes === 1 ? "like" : "likes"}
  </button>
);

export const showsNoNegativeCount = () => !getView().includes("-");
