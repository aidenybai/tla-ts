(*---
description: z3test's regression regressions/smt2/2889.smt2.
ref: regressions/smt2/2889.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Int)
(declare-fun b () Int)
(declare-fun c () Real)
(declare-fun d () Real)
(declare-fun e () Real)
(assert (= (+ a e) (+ b (/ c d))))
(assert (> e 0.0))
(assert (> e 1.0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
