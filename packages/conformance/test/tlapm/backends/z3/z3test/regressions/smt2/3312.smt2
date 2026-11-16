(*---
description: z3test's regression regressions/smt2/3312.smt2.
ref: regressions/smt2/3312.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun q1 () Real) 
(declare-fun q2 () Real) 
(declare-fun q3 () Real) 
(assert (< q1 q2 q3)) 
(minimize q1) 
(minimize q2) 
(minimize q3) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
