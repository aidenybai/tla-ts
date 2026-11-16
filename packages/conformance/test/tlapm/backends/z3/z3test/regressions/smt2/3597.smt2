(*---
description: z3test's regression regressions/smt2/3597.smt2.
ref: regressions/smt2/3597.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.random_seed 1) 
(set-option :proof true) 
(set-option :trace true)    
(declare-fun a () Real) 
(declare-fun b () Real)   
(assert (not (=> (= a b) (< a (*  (+ (+ (div 2.0 b))))) (< 0 a))))  
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
