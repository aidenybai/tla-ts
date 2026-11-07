(*---
description: z3test's regression old-regressions/smt2/t66.smt2.
ref: old-regressions/smt2/t66.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Int)

(assert (>= x 0))
(assert (iff (and (>= x 1)
                  (not (or (not (and (>= x 2)
                                     (>= x 5)))
                           (>= x 3))))
                  true))
(assert (>= x 100))
(apply simplify)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (>= x 0)
      (>= x 1)
      (>= x 100)
      (>= x 2)
      (>= x 5)
      (not (>= x 3))
      :precision precise :depth 1)
    )
---*)
