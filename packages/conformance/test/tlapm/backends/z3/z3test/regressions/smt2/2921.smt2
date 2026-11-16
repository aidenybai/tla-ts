(*---
description: z3test's regression regressions/smt2/2921.smt2.
ref: regressions/smt2/2921.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_NRA)
(check-sat-using ctx-solver-simplify)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
