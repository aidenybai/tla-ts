(*---
description: z3test's regression regressions/smt2/3680.smt2.
ref: regressions/smt2/3680.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :rewriter.arith_lhs true)
(set-option :rewriter.sort_sums true)
(declare-fun a () Real)
(declare-fun b () Real)
(assert (> (+ (* 2 a) (* (- 2) b)) 0))
(check-sat-using ufbv)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
