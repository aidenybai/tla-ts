(*---
description: z3test's regression regressions/smt2/3570.smt2.
ref: regressions/smt2/3570.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :trace true) 
(declare-fun a () Real)  
(assert (< (+ a) 8 a)) 
(check-sat-using qfnia)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
