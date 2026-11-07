(*---
description: z3test's regression regressions/smt2/3523.smt2.
ref: regressions/smt2/3523.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true) 
(declare-fun a (Int Int) Bool) 
(assert (forall ((b Int) (c Int)) (xor (>= c (/ 7 b)) (a b c)))) 
(assert (a 4 1)) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
