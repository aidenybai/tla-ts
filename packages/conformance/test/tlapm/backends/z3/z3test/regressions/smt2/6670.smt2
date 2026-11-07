(*---
description: z3test's regression regressions/smt2/6670.smt2.
ref: regressions/smt2/6670.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-fun i () Int)
(assert (> (rem i i) 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
