(*---
description: z3test's regression regressions/smt2/opt_nlsat_unbounded_box.smt2.
ref: regressions/smt2/opt_nlsat_unbounded_box.smt2
features:
  - z3test
outcome: sat
---*)
; box: one objective unbounded above (x^2 >= 4 leaves x >= 2 feasible for any
; bound) proven oo by the quantified query, the other attained at the
; irrational optimum sqrt(2) reported as a root-obj.
(set-option :opt.priority box)
(declare-const x Real)
(declare-const y Real)
(assert (>= (* x x) 4.0))
(assert (<= (* y y) 2.0))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x oo)
     (y (root-obj (+ (^ x 2) (- 2)) 2))
    )
---*)
