(*---
description: z3test's regression regressions/smt2/3574.smt2.
ref: regressions/smt2/3574.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.eager_eq_axioms false) 
(set-option :trace true) 
(set-option :smt.arith.propagate_eqs false) 
(declare-fun n () Int) 
(declare-fun x () Int) 
(assert (> n 4)) 
(assert (>= (div 95 x n) n)) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
