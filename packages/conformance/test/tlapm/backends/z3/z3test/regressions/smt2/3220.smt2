(*---
description: z3test's regression regressions/smt2/3220.smt2.
ref: regressions/smt2/3220.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :sat.local_search true)
(set-option :model_validate true)
(declare-fun a () Bool)
(declare-fun b () Bool)
(assert (and (xor a b) a b))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
