(*---
description: z3test's regression regressions/smt2/2890.smt2.
ref: regressions/smt2/2890.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-fun a () Int)
(declare-fun b () Real)
(assert (= b (/ 0 a)))
(assert (> b 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
