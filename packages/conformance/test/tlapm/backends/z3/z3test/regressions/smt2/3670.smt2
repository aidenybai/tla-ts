(*---
description: z3test's regression regressions/smt2/3670.smt2.
ref: regressions/smt2/3670.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(declare-fun a (Int Int) Int)
(assert (forall ((b Int)) (= (a b 0) 0)))
(check-sat-using ufbv)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
