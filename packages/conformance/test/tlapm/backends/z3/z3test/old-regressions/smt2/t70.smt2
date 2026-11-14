(*---
description: z3test's regression old-regressions/smt2/t70.smt2.
ref: old-regressions/smt2/t70.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Int)

(assert (= x x))

(apply simplify)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      :precision precise :depth 1)
    )
---*)
