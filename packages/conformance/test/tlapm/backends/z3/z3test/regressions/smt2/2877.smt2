(*---
description: z3test's regression regressions/smt2/2877.smt2.
ref: regressions/smt2/2877.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun x () Int)
(declare-fun y () Int)
(assert (= x 0))
(assert (distinct (div (* x y) y) x))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
