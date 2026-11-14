(*---
description: z3test's regression regressions/smt2/2420.smt2.
ref: regressions/smt2/2420.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun q (Int) Int)
(check-sat)
(get-model)
(get-value (q))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (
      (define-fun q ((x!0 Int)) Int
        0)
    )
    ((q ((as const (Array Int Int)) 0)))
---*)
