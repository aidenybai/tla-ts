(*---
description: z3test's regression regressions/smt2/o3.smt2.
ref: regressions/smt2/o3.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2015 Microsoft Corporation
(declare-const x Int)
(assert (<= x 2))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x 2)
    )
---*)
