(*---
description: z3test's regression old-regressions/smt2/t43.smt2.
ref: old-regressions/smt2/t43.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Int)

(simplify (* 1 a))
(simplify (* 0 a))
(simplify (* a 1))
(simplify (* a 0))

(*--- recorded
all:
  exit: 0
  transcript: |-
    a
    0
    a
    0
---*)
