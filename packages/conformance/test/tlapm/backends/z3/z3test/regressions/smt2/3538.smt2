(*---
description: z3test's regression regressions/smt2/3538.smt2.
ref: regressions/smt2/3538.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true) 
(declare-fun a () Int) 
(declare-fun b () Int) 
(assert (or (= a 5) (= a 7) (= a 0))) 
(assert (<= (* b b) 0)) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
