(*---
description: z3test's regression regressions/smt2/3127.smt2.
ref: regressions/smt2/3127.smt2
features:
  - z3test
outcome: sat
---*)
(assert (not (forall ((a Real) (b Real)) (< b (/ 1.0 a) (/ 1.0 (- 2.0 a))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
