(*---
description: z3test's regression old-regressions/smt2/t226.smt2.
ref: old-regressions/smt2/t226.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Int)
(declare-const y Int)

(simplify (rem x (+ x 1)))
(simplify (rem x y))
(simplify (rem x 0))
(simplify (rem x (+ x 1))
          :elim-rem true)
(simplify (rem x y)
          :elim-rem true)
(simplify (rem x 0)
          :elim-rem true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (rem x (+ 1 x))
    (rem x y)
    (rem x 0)
    (ite (>= x (- 1)) (mod x (+ 1 x)) (* (- 1) (mod x (+ 1 x))))
    (ite (>= y 0) (mod x y) (* (- 1) (mod x y)))
    (mod x 0)
---*)
