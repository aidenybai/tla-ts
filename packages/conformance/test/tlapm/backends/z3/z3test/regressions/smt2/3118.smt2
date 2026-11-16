(*---
description: z3test's regression regressions/smt2/3118.smt2.
ref: regressions/smt2/3118.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(declare-fun a () Int)
(declare-fun b () Real)
(declare-fun c () Real)
(assert (> a 0))
(assert (= (* (/ b b) c) 2.0))
(set-option :model_validate true)
(check-sat)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
