(*---
description: z3test's regression regressions/smt2/3587.smt2.
ref: regressions/smt2/3587.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :rewriter.eq2ineq true) 
(set-option :smt.core.extend_patterns true) 
(assert (forall ((a Int) (b Int)) (distinct b a))) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
