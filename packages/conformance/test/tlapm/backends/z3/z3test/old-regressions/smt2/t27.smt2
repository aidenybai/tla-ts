(*---
description: z3test's regression old-regressions/smt2/t27.smt2.
ref: old-regressions/smt2/t27.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(simplify (distinct 0 1 2 3 4 5 6))
(declare-fun a () Int)
(simplify (distinct 0 1 2 3 a 4 5 6))
(simplify (distinct a 0 1 2 3 4 5 6))
(simplify (distinct 0 1 2 3 4 5 6 a))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    (distinct 0 1 2 3 a 4 5 6)
    (distinct a 0 1 2 3 4 5 6)
    (distinct 0 1 2 3 4 5 6 a)
---*)
