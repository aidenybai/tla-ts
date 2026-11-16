(*---
description: z3test's regression regressions/smt2/3688.smt2.
ref: regressions/smt2/3688.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true) 
(declare-fun a (Int Int Real) Real) 
(assert (= 0 0)) 
(assert (forall ((?b Real)) (= (a 0 0 ?b) 0.0))) 
(check-sat-using quasi-macros)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
