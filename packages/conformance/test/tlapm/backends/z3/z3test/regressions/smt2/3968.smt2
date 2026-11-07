(*---
description: z3test's regression regressions/smt2/3968.smt2.
ref: regressions/smt2/3968.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Int)
(declare-fun b () Int)
(assert (distinct a b))
;(check-sat)
(check-sat-using (then qe2 smt))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
