(*---
description: z3test's regression regressions/smt2/3554.smt2.
ref: regressions/smt2/3554.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(set-option :smt.clause_proof true)
(set-option :smt.arith.solver 6)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(assert (= (< c a) (< 0 (* (- a c) b))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
