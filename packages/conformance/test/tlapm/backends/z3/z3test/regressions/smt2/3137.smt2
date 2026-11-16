(*---
description: z3test's regression regressions/smt2/3137.smt2.
ref: regressions/smt2/3137.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_BV)
(set-option :model_validate true)
(declare-const v0 Bool)
(declare-const v1 Bool)
(declare-const v2 Bool)
(declare-const v3 Bool)
(declare-const v4 Bool)
(declare-const v5 Bool)
(assert v1)
(assert v2)
(push 1)
(assert (or (xor v5 v4 true) v2 v3))
(push 1)
(pop 1)
(pop 1)
(assert (xor v5 v4 v2)) 
(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
