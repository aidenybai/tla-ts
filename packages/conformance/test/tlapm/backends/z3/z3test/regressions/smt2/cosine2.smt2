(*---
description: z3test's regression regressions/smt2/cosine2.smt2.
ref: regressions/smt2/cosine2.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)

(simplify (cos (* (/ 1 4) pi)))
(simplify (cos (* (/ 3 4) pi)))
(simplify (cos (* (/ 5 4) pi)))
(simplify (cos (* (/ 7 4) pi)))
(echo "....")
(simplify (cos (* (/ 1 3) pi)))
(simplify (cos (* (/ 2 3) pi)))
(simplify (cos (* (/ 4 3) pi)))
(simplify (cos (* (/ 5 3) pi)))
(echo "....")
(simplify (cos (* (/ 1 12) pi)))
(simplify (cos (* (/ 11 12) pi)))
(simplify (cos (* (/ 13 12) pi)))
(simplify (cos (* (/ 23 12) pi)))
(echo "....")
(simplify (cos (* (/ 5 12) pi)))
(simplify (cos (* (/ 7 12) pi)))
(simplify (cos (* (/ 17 12) pi)))
(simplify (cos (* (/ 19 12) pi)))

(echo "ucosg decimals")

(set-option :pp.decimal true)
(simplify (cos (* (/ 1 4) pi)))
(simplify (cos (* (/ 3 4) pi)))
(simplify (cos (* (/ 5 4) pi)))
(simplify (cos (* (/ 7 4) pi)))
(echo "....")
(simplify (cos (* (/ 1 3) pi)))
(simplify (cos (* (/ 2 3) pi)))
(simplify (cos (* (/ 4 3) pi)))
(simplify (cos (* (/ 5 3) pi)))
(echo "....")
(simplify (cos (* (/ 1 12) pi)))
(simplify (cos (* (/ 11 12) pi)))
(simplify (cos (* (/ 13 12) pi)))
(simplify (cos (* (/ 23 12) pi)))
(echo "....")
(simplify (cos (* (/ 5 12) pi)))
(simplify (cos (* (/ 7 12) pi)))
(simplify (cos (* (/ 17 12) pi)))
(simplify (cos (* (/ 19 12) pi)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 2)
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 1)
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 1)
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 2)
    ....
    (/ 1.0 2.0)
    (- (/ 1.0 2.0))
    (- (/ 1.0 2.0))
    (/ 1.0 2.0)
    ....
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 4)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 1)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 1)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 4)
    ....
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 3)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 2)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 2)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 3)
    ucosg decimals
    0.7071067811?
    (- 0.7071067811?)
    (- 0.7071067811?)
    0.7071067811?
    ....
    0.5
    (- 0.5)
    (- 0.5)
    0.5
    ....
    0.9659258262?
    (- 0.9659258262?)
    (- 0.9659258262?)
    0.9659258262?
    ....
    0.2588190451?
    (- 0.2588190451?)
    (- 0.2588190451?)
    0.2588190451?
---*)
