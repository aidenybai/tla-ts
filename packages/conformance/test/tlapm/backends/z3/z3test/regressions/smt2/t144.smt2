(*---
description: z3test's regression regressions/smt2/t144.smt2.
ref: regressions/smt2/t144.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation



(declare-const x Int)
(define-fun b () Bool (> x 4))
(check-sat b)
(check-sat (not b))
(declare-const p Bool)
(define-fun b2 () Bool (not p))
(check-sat b2)
(check-sat (not b2))
(check-sat (not p))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    sat
    sat
    sat
---*)
