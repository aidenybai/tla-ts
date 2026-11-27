let likes = 0;
let liked = false;

export const like = () => {
  liked = true;
  likes += 1;
};

export const unlike = () => {
  if (!liked) return;
  liked = false;
  likes -= 1;
};

export const emptyHeartMeansZero = () => liked || likes === 0;
