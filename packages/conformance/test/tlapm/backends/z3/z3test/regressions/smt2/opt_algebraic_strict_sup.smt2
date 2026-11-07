(*---
description: z3test's regression regressions/smt2/opt_algebraic_strict_sup.smt2.
ref: regressions/smt2/opt_algebraic_strict_sup.smt2
features:
  - z3test
outcome: sat
---*)
; The supremum sqrt(2) is not attained. Prove both the strict upper bound
; and that feasible values approach it, then report sqrt(2) - epsilon.
(declare-const x Real)
(assert (< (* x x) 2.0))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
---*)
