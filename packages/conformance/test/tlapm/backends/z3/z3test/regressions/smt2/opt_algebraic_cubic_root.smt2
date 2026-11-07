(*---
description: z3test's regression regressions/smt2/opt_algebraic_cubic_root.smt2.
ref: regressions/smt2/opt_algebraic_cubic_root.smt2
features:
  - z3test
outcome: sat
---*)
; maximize x s.t. x^3 - 3x + 1 <= 0: optimum is the largest root of the cubic, 1.5320888...
(declare-const x Real)
(assert (<= (+ (* x x x) (* (- 3.0) x) 1.0) 0.0))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (root-obj (+ (^ x 3) (* (- 3) x) 1) 3))
    )
---*)
