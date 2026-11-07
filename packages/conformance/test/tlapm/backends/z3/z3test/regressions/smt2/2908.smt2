(*---
description: z3test's regression regressions/smt2/2908.smt2.
ref: regressions/smt2/2908.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a (Int) Int)
(declare-fun b () Int)
(assert (= (ite (= b (a 0)) b (+ 2 b)) (ite (= b (a 0)) b (- 1 b))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
