(*---
description: z3test's regression regressions/smt2/3700.smt2.
ref: regressions/smt2/3700.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-option :smt.arith.random_initial_value true)
(set-option :rewriter.eq2ineq true)
(declare-fun a () Int)
(assert (distinct (str.indexof "" "" a) 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
