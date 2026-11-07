(*---
description: z3test's regression regressions/smt2/3999.smt2.
ref: regressions/smt2/3999.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () String)
(declare-fun b () Int)
(assert (= (str.replace "A" (int.to.str b) a) "A"))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
