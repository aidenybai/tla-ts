(*---
description: z3test's regression regressions/smt2/3827.smt2.
ref: regressions/smt2/3827.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic HORN)
(declare-fun a (Real) Bool)
(assert (a 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
