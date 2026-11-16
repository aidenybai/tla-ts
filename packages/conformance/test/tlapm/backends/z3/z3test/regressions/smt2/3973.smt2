(*---
description: z3test's regression regressions/smt2/3973.smt2.
ref: regressions/smt2/3973.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (forall ((a Int)) (exists ((b Int)) (= (* 2 b) a))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
