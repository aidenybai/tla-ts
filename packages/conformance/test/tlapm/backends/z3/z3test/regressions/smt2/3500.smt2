(*---
description: z3test's regression regressions/smt2/3500.smt2.
ref: regressions/smt2/3500.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () String) 
(declare-fun b () String) 
(declare-fun c () String) 
(declare-fun d () String) 
(assert (or (distinct a (str.++ b c)) (distinct b  d)  
(not (str.in.re d (str.to.re "."))))) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
