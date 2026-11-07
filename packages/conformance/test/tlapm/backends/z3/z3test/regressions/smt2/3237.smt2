(*---
description: z3test's regression regressions/smt2/3237.smt2.
ref: regressions/smt2/3237.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-option :smt.arith.random_initial_value true)
(declare-const i1 Int)
(declare-const i2 Int)
(push)
(assert (>= (div 63 (div i2 (* i1 67 i2))) 63))
(assert (< 67 i2))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
