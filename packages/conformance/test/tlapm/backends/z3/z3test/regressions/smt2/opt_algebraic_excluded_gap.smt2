(*---
description: z3test's regression regressions/smt2/opt_algebraic_excluded_gap.smt2.
ref: regressions/smt2/opt_algebraic_excluded_gap.smt2
features:
  - z3test
outcome: sat
---*)
; maximize x s.t. x^2 < 4 and x != 1: the rightmost infeasible interval [2,oo) starts
; closed, with a gap to the excluded point 1; the supremum 2 is not attained
(declare-const x Real)
(assert (< (* x x) 4.0))
(assert (not (= x 1.0)))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (+ 2.0 (* (- 1.0) epsilon)))
    )
---*)
