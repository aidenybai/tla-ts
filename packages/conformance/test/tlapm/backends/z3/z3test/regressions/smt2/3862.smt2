(*---
description: z3test's regression regressions/smt2/3862.smt2.
ref: regressions/smt2/3862.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Int)
(declare-fun b () Int)
(assert (= b 11))
(assert (= (div 1 b (+ 1 (div 1 b a))) 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
