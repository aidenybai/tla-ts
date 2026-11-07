(*---
description: z3test's regression regressions/smt2/sine2.smt2.
ref: regressions/smt2/sine2.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)

(simplify (sin (* (/ 1 4) pi)))
(simplify (sin (* (/ 3 4) pi)))
(simplify (sin (* (/ 5 4) pi)))
(simplify (sin (* (/ 7 4) pi)))
(echo "....")
(simplify (sin (* (/ 1 3) pi)))
(simplify (sin (* (/ 2 3) pi)))
(simplify (sin (* (/ 4 3) pi)))
(simplify (sin (* (/ 5 3) pi)))
(echo "....")
(simplify (sin (* (/ 1 12) pi)))
(simplify (sin (* (/ 11 12) pi)))
(simplify (sin (* (/ 13 12) pi)))
(simplify (sin (* (/ 23 12) pi)))
(echo "....")
(simplify (sin (* (/ 5 12) pi)))
(simplify (sin (* (/ 7 12) pi)))
(simplify (sin (* (/ 17 12) pi)))
(simplify (sin (* (/ 19 12) pi)))

(echo "using decimals")

(set-option :pp.decimal true)
(simplify (sin (* (/ 1 4) pi)))
(simplify (sin (* (/ 3 4) pi)))
(simplify (sin (* (/ 5 4) pi)))
(simplify (sin (* (/ 7 4) pi)))
(echo "....")
(simplify (sin (* (/ 1 3) pi)))
(simplify (sin (* (/ 2 3) pi)))
(simplify (sin (* (/ 4 3) pi)))
(simplify (sin (* (/ 5 3) pi)))
(echo "....")
(simplify (sin (* (/ 1 12) pi)))
(simplify (sin (* (/ 11 12) pi)))
(simplify (sin (* (/ 13 12) pi)))
(simplify (sin (* (/ 23 12) pi)))
(echo "....")
(simplify (sin (* (/ 5 12) pi)))
(simplify (sin (* (/ 7 12) pi)))
(simplify (sin (* (/ 17 12) pi)))
(simplify (sin (* (/ 19 12) pi)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 2)
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 2)
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 1)
    (root-obj (+ (* 2 (^ x 2)) (- 1)) 1)
    ....
    (root-obj (+ (* 4 (^ x 2)) (- 3)) 2)
    (root-obj (+ (* 4 (^ x 2)) (- 3)) 2)
    (root-obj (+ (* 4 (^ x 2)) (- 3)) 1)
    (root-obj (+ (* 4 (^ x 2)) (- 3)) 1)
    ....
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 3)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 3)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 2)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 2)
    ....
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 4)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 4)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 1)
    (root-obj (+ (* 16 (^ x 4)) (* (- 16) (^ x 2)) 1) 1)
    using decimals
    0.7071067811?
    0.7071067811?
    (- 0.7071067811?)
    (- 0.7071067811?)
    ....
    0.8660254037?
    0.8660254037?
    (- 0.8660254037?)
    (- 0.8660254037?)
    ....
    0.2588190451?
    0.2588190451?
    (- 0.2588190451?)
    (- 0.2588190451?)
    ....
    0.9659258262?
    0.9659258262?
    (- 0.9659258262?)
    (- 0.9659258262?)
---*)
