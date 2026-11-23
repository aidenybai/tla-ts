const shape: Shape = { sides: 4 };
const pairs: Pair[] = [{ left: 1, right: 2 }];
const box: Box<Shape> = { value: shape };
box.value.sides += 1;
pairs[0].left = shape.sides;
const seen = [shape.sides, pairs[0].left, box.value === shape].join();
if (seen !== "5,5,true") throw new Error("seen " + seen);
