(*---
description: z3test's regression regressions/smt2/3742.smt2.
ref: regressions/smt2/3742.smt2
features:
  - z3test
outcome: unsat
---*)
;(set-logic QF_UFNIA)
(set-option :model_validate true)
(set-option :rewriter.flat false)
(set-option :smt.arith.solver 6)
(declare-const i4 Int)
(declare-const i5 Int)
(push 1)
(assert (= (- i4 i5) (+ (- i4 i5) 50)))
(check-sat)
(reset)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
