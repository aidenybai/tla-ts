(*---
description: z3test's regression regressions/smt2/3434.smt2.
ref: regressions/smt2/3434.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (xor false)) 
(check-sat-using aig)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
