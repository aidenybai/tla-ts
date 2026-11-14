(*---
description: z3test's regression regressions/smt2/3917.smt2.
ref: regressions/smt2/3917.smt2
features:
  - z3test
outcome: unsat
---*)
(define-fun-rec a ((b Int)) Int 0)
(assert (= (a 0) 1))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
