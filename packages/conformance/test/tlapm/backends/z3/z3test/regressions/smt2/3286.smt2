(*---
description: z3test's regression regressions/smt2/3286.smt2.
ref: regressions/smt2/3286.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true) 
(declare-fun a () Int)     
(declare-fun b () Int) 
(assert (>= a 0 a ( * a b))) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
