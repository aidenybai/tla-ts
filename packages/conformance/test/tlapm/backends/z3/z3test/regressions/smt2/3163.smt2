(*---
description: z3test's regression regressions/smt2/3163.smt2.
ref: regressions/smt2/3163.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-fun a () Bool)
(declare-fun b () Bool)
(assert (or (not (and a b)) a))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
