(*---
description: z3test's regression regressions/smt2/8099.smt2.
ref: regressions/smt2/8099.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun v0 () Real) 
(declare-fun v1 () Real) 
(assert (= (+ 1 0 (* (- (* (/ 1 0) (+ (- (/ 1 11)) v0 v1)) (+ (- (/ 1 11)) v0)) 
(- (* (/ 1 (div (+ 1 v0 v1) 1)) (+ (- (/ 1 11)) v0 v1)) (+ (- (/ 1 11)) v0)))) v0)) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
