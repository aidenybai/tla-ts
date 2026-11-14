(*---
description: z3test's regression regressions/smt2/sine3.smt2.
ref: regressions/smt2/sine3.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)

(define-fun my-sin ((x Real)) Real
  (sin (+ x (* 2 pi))))

(simplify (my-sin (* (/ 1 4) pi)))
(simplify (my-sin (* (/ 3 4) pi)))
(simplify (my-sin (* (/ 5 4) pi)))
(simplify (my-sin (* (/ 7 4) pi)))
(echo "....")
(simplify (my-sin (* (/ 1 3) pi)))
(simplify (my-sin (* (/ 2 3) pi)))
(simplify (my-sin (* (/ 4 3) pi)))
(simplify (my-sin (* (/ 5 3) pi)))
(echo "....")
(simplify (my-sin (* (/ 1 12) pi)))
(simplify (my-sin (* (/ 11 12) pi)))
(simplify (my-sin (* (/ 13 12) pi)))
(simplify (my-sin (* (/ 23 12) pi)))
(echo "....")
(simplify (my-sin (* (/ 5 12) pi)))
(simplify (my-sin (* (/ 7 12) pi)))
(simplify (my-sin (* (/ 17 12) pi)))
(simplify (my-sin (* (/ 19 12) pi)))

(echo "using decimals")

(set-option :pp.decimal true)
(simplify (my-sin (* (/ 1 4) pi)))
(simplify (my-sin (* (/ 3 4) pi)))
(simplify (my-sin (* (/ 5 4) pi)))
(simplify (my-sin (* (/ 7 4) pi)))
(echo "....")
(simplify (my-sin (* (/ 1 3) pi)))
(simplify (my-sin (* (/ 2 3) pi)))
(simplify (my-sin (* (/ 4 3) pi)))
(simplify (my-sin (* (/ 5 3) pi)))
(echo "....")
(simplify (my-sin (* (/ 1 12) pi)))
(simplify (my-sin (* (/ 11 12) pi)))
(simplify (my-sin (* (/ 13 12) pi)))
(simplify (my-sin (* (/ 23 12) pi)))
(echo "....")
(simplify (my-sin (* (/ 5 12) pi)))
(simplify (my-sin (* (/ 7 12) pi)))
(simplify (my-sin (* (/ 17 12) pi)))
(simplify (my-sin (* (/ 19 12) pi)))

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
