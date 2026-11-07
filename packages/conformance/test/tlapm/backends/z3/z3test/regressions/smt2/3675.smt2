(*---
description: z3test's regression regressions/smt2/3675.smt2.
ref: regressions/smt2/3675.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :sat.prob_search true)
(declare-fun a () Bool)
(declare-fun b () Bool)
(assert a)
(assert b)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
