interface Shape {
  sides: number;
}

type Pair = { left: number; right: number };

interface Box<T> {
  value: T;
}
