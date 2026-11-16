(*---
description: z3test's regression regressions/smt2/3715.smt2.
ref: regressions/smt2/3715.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-const i5 Int)
(declare-const i12 Int)
(assert (>= 83 i12))
(assert (distinct 7 i5))
(assert (<= i12 91))
(assert-soft (or (>= 83 i12)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
