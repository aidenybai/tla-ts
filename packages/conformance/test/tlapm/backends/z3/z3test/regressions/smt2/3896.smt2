(*---
description: z3test's regression regressions/smt2/3896.smt2.
ref: regressions/smt2/3896.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun a () Int)
(assert (distinct 0 (div 0 a)))
(assert (= 0 (div (- (* a a) a) a)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
