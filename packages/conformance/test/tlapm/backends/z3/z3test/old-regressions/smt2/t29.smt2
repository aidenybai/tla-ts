(*---
description: z3test's regression old-regressions/smt2/t29.smt2.
ref: old-regressions/smt2/t29.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



(display (forall ((x Int)) (! (< x 0) :no-pattern (< x 0))))
(display (forall ((x Int)) (! (< x 0) :no-pattern (< x 0) :no-pattern (> x 0))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (forall ((x Int)) (! (< x 0) :no-pattern (< x 0)))
    (forall ((x Int)) (! (< x 0) :no-pattern (< x 0) :no-pattern (> x 0)))
---*)
