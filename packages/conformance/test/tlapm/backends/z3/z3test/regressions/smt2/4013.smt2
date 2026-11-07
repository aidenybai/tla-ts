(*---
description: z3test's regression regressions/smt2/4013.smt2.
ref: regressions/smt2/4013.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (exists ((a Int)) false))
(assert (forall ((b Int)) false))
(check-sat-using nnf)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
