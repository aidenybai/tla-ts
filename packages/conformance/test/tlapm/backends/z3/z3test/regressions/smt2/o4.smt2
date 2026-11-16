(*---
description: z3test's regression regressions/smt2/o4.smt2.
ref: regressions/smt2/o4.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2015 Microsoft Corporation
(declare-const x Real)
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
