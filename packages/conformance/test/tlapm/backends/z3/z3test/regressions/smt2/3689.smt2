(*---
description: z3test's regression regressions/smt2/3689.smt2.
ref: regressions/smt2/3689.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(set-option :rewriter.flat false) 
(declare-fun a () Real) 
(declare-fun b () Real) 
(assert (< a (* (* a b) 7) (mod 0 0))) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
