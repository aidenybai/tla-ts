(*---
description: z3test's regression old-regressions/smt2/t228.smt2.
ref: old-regressions/smt2/t228.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Real)

(simplify (^ (^ x 2.0) 4.0))

(simplify (^ (^ (+ x 1.0) 2.0) 4.0))


(simplify (^ (^ (+ x 1.0) 2.0) 2.0)
          :expand-power true)

(simplify (^ (^ (+ x 1.0) 2.0) 2.0)
          :expand-power true
          :som true)

(simplify (^ (+ x 2.0) (/ 3.0 2.0))
          :expand-power true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (^ x 8.0)
    (^ (+ 1.0 x) 8.0)
    (* (+ 1.0 x) (+ 1.0 x) (+ 1.0 x) (+ 1.0 x))
    (+ 1.0 (* 4.0 x) (* 6.0 x x) (* 4.0 x x x) (* x x x x))
    (* (^ (+ 2.0 x) (/ 1.0 2.0))
       (^ (+ 2.0 x) (/ 1.0 2.0))
       (^ (+ 2.0 x) (/ 1.0 2.0)))
---*)
