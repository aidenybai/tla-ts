(*---
description: z3test's regression regressions/smt2/3642.smt2.
ref: regressions/smt2/3642.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic NRA)
(set-option :proof true)
(declare-const v9 Bool)
(assert (or (forall ((q3 Bool) (q4 Real) (q5 Real)) v9) (exists ((q3 Bool) (q4 Real) (q5 Real)) (=> v9 q3))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
