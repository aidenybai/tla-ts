(*---
description: z3test's regression regressions/smt2/2891.smt2.
ref: regressions/smt2/2891.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun x () Real)
(assert (= (^ (- 1.0 x) (- 1.0)) (* 2.0 (^ x (- 1.0)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
