(*---
description: z3test's regression regressions/smt2/3116.smt2.
ref: regressions/smt2/3116.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Bool)
(declare-fun b () Bool)
(assert (or (not (and a b)) (not a)))
(check-sat-using qfufbv_ackr)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
