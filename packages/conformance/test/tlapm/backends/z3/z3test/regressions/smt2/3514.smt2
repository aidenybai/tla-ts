(*---
description: z3test's regression regressions/smt2/3514.smt2.
ref: regressions/smt2/3514.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun a () Int) 
(assert (= a 9)) 
(assert (= (* (/ a a) a) (- (/ (+ a a) a) a))) 
(assert (distinct (- (div (+  a  a) a) a) a)) 
(check-sat-using  ctx-simplify)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
