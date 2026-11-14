(*---
description: z3test's regression regressions/smt2/t210.smt2.
ref: regressions/smt2/t210.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.decimal true)
(declare-const x Real)
(declare-const y Real)

(simplify (+ 3.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (+ x 3.0 x (^ 2.0 (/ 1.0 2.0))))
(simplify (+ x 3.0 x y (^ 2.0 (/ 1.0 2.0))))
(simplify (+ x 3.0 1.0))
(simplify (+ (^ 3.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0))))
(simplify (+ (^ 3.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0))))
(simplify (+ (^ 3.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0)))
          :max-degree 2)
(simplify (+ x y (^ 3.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0))))
(simplify (+ x y 1.0 (^ 3.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0)) 1.0 (^ 5.0 (/ 1.0 2.0)))
          :max-degree 2)
(simplify (+ x y 1.0 (^ 3.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0)) 1.0 (^ 5.0 (/ 1.0 2.0)) 1.0)
          :max-degree 2)

(*--- recorded
all:
  exit: 0
  transcript: |-
    4.4142135623?
    (+ (* 2.0 x) 4.4142135623?)
    (+ (* 2.0 x) y 4.4142135623?)
    (+ 4.0 x)
    3.1462643699?
    5.3823323474?
    (+ 3.1462643699? 2.2360679774?)
    (+ x y 5.3823323474?)
    (+ x y 4.1462643699? 3.2360679774?)
    (+ x y 4.1462643699? 4.2360679774?)
---*)
