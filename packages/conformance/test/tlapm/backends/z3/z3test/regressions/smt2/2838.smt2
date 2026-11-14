(*---
description: z3test's regression regressions/smt2/2838.smt2.
ref: regressions/smt2/2838.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () String)   
(assert  (and  (= (ite (= (str.at (str.substr a (+ (str.indexof a "=" 0) 1)                       
              (- (str.len a) (+ (str.indexof a "=" 0) 1))) (- (str.len (str.substr a (+ (str.indexof a "=" 0) 1) 
              (- (str.len a) (+ (str.indexof a "=" 0) 1)))) 1)) "") 1 0) 0) 
              (not (= (ite (= (str.at (str.substr a (- (str.indexof a "=" 0) 1)               
              (- (str.len a) (+ (str.indexof a "=" 0) 1))) 0) " ") 1 0) 0))))            
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
