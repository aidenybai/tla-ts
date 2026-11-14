(*---
description: z3test's regression regressions/smt2/opt_algebraic_scaled.smt2.
ref: regressions/smt2/opt_algebraic_scaled.smt2
features:
  - z3test
outcome: sat
---*)
; maximize 3x s.t. x^2 <= 2: optimum 3*sqrt(2) = sqrt(18)
(declare-const x Real)
(assert (<= (* x x) 2.0))
(maximize (* 3.0 x))
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     ((* 3.0 x) (root-obj (+ (^ x 2) (- 18)) 2))
    )
---*)
