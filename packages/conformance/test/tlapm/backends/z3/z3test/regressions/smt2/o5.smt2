(*---
description: z3test's regression regressions/smt2/o5.smt2.
ref: regressions/smt2/o5.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2015 Microsoft Corporation
(declare-const x Int)
(declare-const y Int)
(assert (<= x y))
(assert (<= y 5))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x 5)
    )
---*)
