(*---
description: z3test's regression regressions/smt2/tan3.smt2.
ref: regressions/smt2/tan3.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)
(declare-const y Real)
(declare-const a Int)
(declare-const b Int)

(simplify (tan (+ x (* pi (to_real a)) y)) :expand-tan true)
(simplify (tan x) :expand-tan true)
(simplify (tan (+ x (/ pi 2))) :expand-tan true)
(simplify (tan (+ x (/ (* 3 pi) 2))) :expand-tan true)
(simplify (/ x (- y)))
(simplify (/ (* 2 x) (* 3 y)))
(simplify (= (tan (+ x (/ pi 2))) (tan (+ x (/ (* 3 pi) 2)))) :expand-tan true)
(simplify (= (tan (+ x (/ (* 5 pi) 2))) (tan (+ x (/ (* 3 pi) 2)))) :expand-tan true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (/ (sin (+ x y)) (cos (+ x y)))
    (/ (sin x) (cos x))
    (/ (cos x) (* (- 1.0) (sin x)))
    (/ (* (- 1.0) (cos x)) (sin x))
    (/ x (* (- 1.0) y))
    (/ (* 2.0 x) (* 3.0 y))
    (= (/ (cos x) (* (- 1.0) (sin x))) (/ (* (- 1.0) (cos x)) (sin x)))
    (= (/ (cos x) (* (- 1.0) (sin x))) (/ (* (- 1.0) (cos x)) (sin x)))
---*)
