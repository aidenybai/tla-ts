(*---
description: z3test's regression regressions/smt2/opt_algebraic_max_sqrt2.smt2.
ref: regressions/smt2/opt_algebraic_max_sqrt2.smt2
features:
  - z3test
outcome: sat
---*)
; maximize x s.t. x^2 <= 2: the optimum sqrt(2) is irrational and is reported exactly as a root-obj (nlsat cells)
(declare-const x Real)
(assert (<= (* x x) 2.0))
(maximize x)
(check-sat)
(get-objectives)
(get-value (x))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (root-obj (+ (^ x 2) (- 2)) 2))
    )
    ((x (root-obj (+ (^ x 2) (- 2)) 2)))
---*)
