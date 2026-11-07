(*---
description: z3test's regression regressions/smt2/o6.smt2.
ref: regressions/smt2/o6.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2016 Microsoft Corporation
(declare-fun k () Int)
(assert (< (to_real k) 2))
(maximize k)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (k 1)
    )
---*)
