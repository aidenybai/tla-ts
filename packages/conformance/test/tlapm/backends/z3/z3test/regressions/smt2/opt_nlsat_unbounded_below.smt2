(*---
description: z3test's regression regressions/smt2/opt_nlsat_unbounded_below.smt2.
ref: regressions/smt2/opt_nlsat_unbounded_below.smt2
features:
  - z3test
outcome: sat
---*)
; minimize x s.t. x^2 >= 4, i.e. x <= -2 or x >= 2: unbounded below. Exercises
; the same unboundedness proof through objective negation and reports -oo.
(declare-const x Real)
(assert (>= (* x x) 4.0))
(minimize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (* (- 1) oo))
    )
---*)
