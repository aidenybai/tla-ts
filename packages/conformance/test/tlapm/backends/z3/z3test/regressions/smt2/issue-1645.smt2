(*---
description: z3test's regression regressions/smt2/issue-1645.smt2.
ref: regressions/smt2/issue-1645.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) Levent Erkok
; https://github.com/Z3Prover/z3/issues/1645
(declare-fun x () Int)
(declare-fun y () Int)
(declare-fun z () Int)
(assert (< x z))
(assert (< y z))
(assert (< z 5))
(assert (distinct x y))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)
(get-value (x))
(get-value (y))
(get-value (z))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x 3)
     (y 2)
    )
    ((x 3))
    ((y 2))
    ((z 4))
---*)
