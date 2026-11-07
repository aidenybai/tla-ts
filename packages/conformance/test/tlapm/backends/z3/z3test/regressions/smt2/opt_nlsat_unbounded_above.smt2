(*---
description: z3test's regression regressions/smt2/opt_nlsat_unbounded_above.smt2.
ref: regressions/smt2/opt_nlsat_unbounded_above.smt2
features:
  - z3test
outcome: sat
---*)
; maximize x s.t. x*y = 1 /\ y > 0: x is unbounded above, but no single bound
; x >= c is ever refuted, so the climb alone cannot terminate. After a streak
; of climb rounds the optimizer proves unboundedness with one quantified
; (nlqsat) query and reports oo.
(declare-const x Real)
(declare-const y Real)
(assert (= (* x y) 1.0))
(assert (> y 0.0))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x oo)
    )
---*)
