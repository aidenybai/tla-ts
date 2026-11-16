(*---
description: z3test's regression regressions/smt2/opt_algebraic_offset_negate.smt2.
ref: regressions/smt2/opt_algebraic_offset_negate.smt2
features:
  - z3test
outcome: sat
---*)
; minimize 1 - x s.t. x^2 <= 2: optimum 1 - sqrt(2), root 1 of x^2 - 2x - 1 (sign and offset adjustment of the exact value)
(declare-const x Real)
(assert (<= (* x x) 2.0))
(minimize (- 1.0 x))
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     ((- 1.0 x) (root-obj (+ (^ x 2) (* (- 2) x) (- 1)) 1))
    )
---*)
