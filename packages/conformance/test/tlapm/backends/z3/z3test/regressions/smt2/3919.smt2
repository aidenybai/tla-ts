(*---
description: z3test's regression regressions/smt2/3919.smt2.
ref: regressions/smt2/3919.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :proof true)
(assert (forall ((a (_ FloatingPoint 11 53))) (fp.isNaN a)))
(check-sat-using qffp)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
