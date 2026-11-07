(*---
description: z3test's regression regressions/smt2/3576.smt2.
ref: regressions/smt2/3576.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-option :parallel.enable true)
(declare-fun a () Int)
(declare-fun b () Int)
(declare-fun c (Int) Int)
(assert (distinct b (c a)))
(check-sat)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
