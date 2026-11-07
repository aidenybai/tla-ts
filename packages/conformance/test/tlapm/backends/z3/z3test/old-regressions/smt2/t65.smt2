(*---
description: z3test's regression old-regressions/smt2/t65.smt2.
ref: old-regressions/smt2/t65.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :produce-proofs true)

(declare-const x Int)

(assert (>= x 0))
(assert (= x 3))
(assert (and (>= x 1)
             (not (or (not (and (>= x 2)
                                (>= x 5)))
                      (>= x 3)))))

(apply simplify)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (>= x 0)
      (= x 3)
      (>= x 1)
      (>= x 2)
      (>= x 5)
      (not (>= x 3))
      :precision precise :depth 1)
    )
---*)
