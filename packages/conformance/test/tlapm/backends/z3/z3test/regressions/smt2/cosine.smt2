(*---
description: z3test's regression regressions/smt2/cosine.smt2.
ref: regressions/smt2/cosine.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)

(simplify (cos 0))
(simplify (cos pi))
(simplify (cos (* 2 pi)))
(simplify (cos (* 3 pi)))
(simplify (cos (/ pi 2)))
(simplify (cos (+ pi pi (/ pi 2))))
(simplify (cos (* 3 (/ pi 2))))
(simplify (cos (- (+ (* 2 pi) (/ pi 2)))))
(simplify (cos (/ pi 6)))
(simplify (cos (* (/ 5 6) pi)))
(simplify (cos (* (/ 7 6) pi)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    1.0
    (- 1.0)
    1.0
    (- 1.0)
    0.0
    0.0
    0.0
    0.0
    (root-obj (+ (* 4 (^ x 2)) (- 3)) 2)
    (root-obj (+ (* 4 (^ x 2)) (- 3)) 1)
    (root-obj (+ (* 4 (^ x 2)) (- 3)) 1)
---*)
