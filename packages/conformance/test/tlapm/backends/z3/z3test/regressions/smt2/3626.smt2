(*---
description: z3test's regression regressions/smt2/3626.smt2.
ref: regressions/smt2/3626.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic QF_BV)
(set-option :combined_solver.ignore_solver1 true)
(set-option :sat.local_search true)
(assert false)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
