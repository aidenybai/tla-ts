(*---
description: z3test's regression regressions/smt2/4020.smt2.
ref: regressions/smt2/4020.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(set-option :rewriter.eq2ineq true)
(set-option :smt.arith.eager_eq_axioms false)
(set-option :smt.arith.solver 2)
(declare-fun a () Int)
(declare-fun b () String)
(declare-fun c () String)
(assert (distinct a 0))
(assert (= a (str.len b)))
(assert (= 7 (str.len c)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
