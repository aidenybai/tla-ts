(*---
description: z3test's regression regressions/smt2/3299.smt2.
ref: regressions/smt2/3299.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun a () Int)                                                          
(assert (distinct  "Good"  "Good"))                                             
(assert (> a 0 ))                                                               
(check-sat-using normalize-bounds)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
