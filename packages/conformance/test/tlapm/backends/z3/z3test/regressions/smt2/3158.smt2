(*---
description: z3test's regression regressions/smt2/3158.smt2.
ref: regressions/smt2/3158.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(declare-fun a () Int)
(declare-fun b () Int)
(declare-fun c () Int)
(assert (exists ((d Int)) (> (/ (+ d 1) (+ 0.5 (ite (distinct d a) b c))) 0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
