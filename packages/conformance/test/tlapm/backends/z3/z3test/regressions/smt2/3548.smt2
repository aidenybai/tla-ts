(*---
description: z3test's regression regressions/smt2/3548.smt2.
ref: regressions/smt2/3548.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(set-option :trace true)
(set-option :smt.arith.propagate_eqs false)
(set-option :smt.arith.random_initial_value true)
(set-option :smt.arith.eager_eq_axioms false)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(assert (< (* c (div b (+ a 2))) a))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
