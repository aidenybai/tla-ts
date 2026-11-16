(*---
description: z3test's regression regressions/smt2/abs.smt2.
ref: regressions/smt2/abs.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const a Int)
(declare-const b Int)

(simplify (abs a))

(push)
(assert (< (abs a) 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (ite (>= a 0) a (* (- 1) a))
    unsat
---*)
