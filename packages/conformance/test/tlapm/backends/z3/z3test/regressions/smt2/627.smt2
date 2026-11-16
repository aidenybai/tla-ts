(*---
description: z3test's regression regressions/smt2/627.smt2.
ref: regressions/smt2/627.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :trace  true)  
(declare-fun a () Real) 
(declare-fun b () Real)  
(declare-fun c () Real) 
(declare-fun d () Real) 
(declare-fun g () Real) 
(declare-fun e () Real) 
(declare-fun f () Real) 
(assert (not (= 0 d))) 
(assert (not (= (and (= c f)(< (* (+ (* (mod b g) e))) 0.0 e a)  
(<= 0.0 b g))(< 0 (*(+ e (mod b f))) 0))))  
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
