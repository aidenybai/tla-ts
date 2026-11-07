(*---
description: z3test's regression regressions/smt2/4021.smt2.
ref: regressions/smt2/4021.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (exists ((a Bool)) false))
(assert (not false))
(check-sat-using purify-arith)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
