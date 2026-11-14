(*---
description: z3test's regression old-regressions/smt2/t258.smt2.
ref: old-regressions/smt2/t258.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Real)
(declare-const b Real)

(assert (< b (- 2.0)))

(apply (and-then (! add-bounds :add-bound-upper 10 :add-bound-lower 0) simplify fm))

(check-sat-using (and-then (! add-bounds :add-bound-upper 10 :add-bound-lower 0) simplify fm))

(check-sat-using (and-then simplify (or-else
                                     (and-then (! add-bounds :add-bound-upper 10 :add-bound-lower 0) fm)
                                     fm)))

(check-sat-using (and-then simplify (or-else
                                     (and-then (! add-bounds :add-bound-upper 10 :add-bound-lower 0) fm fail-if-undecided)
                                     fm)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      false
      :precision under :depth 4)
    )
    unknown
    unknown
    sat
---*)
