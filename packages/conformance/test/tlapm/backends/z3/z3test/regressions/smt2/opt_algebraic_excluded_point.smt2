(*---
description: z3test's regression regressions/smt2/opt_algebraic_excluded_point.smt2.
ref: regressions/smt2/opt_algebraic_excluded_point.smt2
features:
  - z3test
outcome: sat
---*)
; maximize x s.t. x^2 <= 4 and x != 2: the infeasible intervals [2,2] and (2,oo) are
; glued, so the supremum 2 is not attained (pick_max_in_complement walks over the glue)
(declare-const x Real)
(assert (<= (* x x) 4.0))
(assert (not (= x 2.0)))
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
