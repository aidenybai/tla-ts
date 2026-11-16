(*---
description: z3test's regression regressions/smt2/3532.smt2.
ref: regressions/smt2/3532.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_ALIA)
(set-option :model_validate true)
(declare-const v1 Bool)
(declare-const v8 Bool)
(declare-const A (Array (Array Int Bool) Bool))
(declare-const B (Array (Array Int Bool) Bool))
(declare-const C (Array (Array Int Bool) Bool))
(assert (or (distinct C A B) v8 v1))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
