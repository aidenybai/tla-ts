(*---
description: z3test's regression regressions/smt2/3934.smt2.
ref: regressions/smt2/3934.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-option :proof true)
(set-option :smt.arith.random_initial_value true)
(declare-const i3 Int)
(declare-const i5 Int)
(assert (>= i3 i5))
(check-sat-using (then simplify fix-dl-var add-bounds qfnra))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
