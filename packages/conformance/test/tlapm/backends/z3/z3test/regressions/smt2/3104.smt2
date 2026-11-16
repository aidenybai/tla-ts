(*---
description: z3test's regression regressions/smt2/3104.smt2.
ref: regressions/smt2/3104.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-const x Real)
(assert (= x 0.0))
(assert (= (^ x (- 1.0)) (/ 1.0 x)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
