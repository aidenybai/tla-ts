(*---
description: z3test's regression old-regressions/smt2/t280.smt2.
ref: old-regressions/smt2/t280.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const a Bool)
(declare-const b Bool)
(declare-const c Bool)
(declare-const d Bool)

(assert (and a (or b (and d a))))

(apply simplify)
(apply ctx-solver-simplify)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      a
      (or b (and d a))
      :precision precise :depth 1)
    )
    (goals
    (goal
      a
      (or b (and d a))
      :precision precise :depth 1)
    )
---*)
