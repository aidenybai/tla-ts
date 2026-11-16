(*---
description: z3test's regression regressions/smt2/3252.smt2.
ref: regressions/smt2/3252.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic NIA)
;(set-option :model_validate true)
(set-option :smt.arith.solver 6)
(assert (> (mod 0 0) 163))
(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
