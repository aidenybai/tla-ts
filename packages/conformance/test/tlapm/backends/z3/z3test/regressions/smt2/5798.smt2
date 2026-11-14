(*---
description: z3test's regression regressions/smt2/5798.smt2.
ref: regressions/smt2/5798.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun r () (Array Bool Bool))
(declare-fun r6 () Int)
(assert (and (select r true) (not (select r (= (abs r6) (abs (abs r6)))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
