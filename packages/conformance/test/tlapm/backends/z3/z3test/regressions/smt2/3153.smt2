(*---
description: z3test's regression regressions/smt2/3153.smt2.
ref: regressions/smt2/3153.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-option :model true)
;(set-option :proof true)

(declare-const v0 Bool)
(declare-const v1 Bool)
(declare-const v2 Bool)
(declare-const v3 Bool)
(declare-const v4 Bool)
(assert (forall ((q0 Bool) (q1 Bool) (q2 Bool) (q3 Bool)) (not (= v1 v1 q3 q1 v4 v0 v3 q2))))
(assert v4)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
