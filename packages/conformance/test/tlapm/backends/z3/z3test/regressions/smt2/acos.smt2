(*---
description: z3test's regression regressions/smt2/acos.smt2.
ref: regressions/smt2/acos.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)

(simplify (acos (- 2)))
(simplify (acos 0))
(simplify (acos 1))
(simplify (acos (- 1)))
(simplify (acos (/ 1 2)))
(simplify (acos (- (/ 1 2))))
(simplify (acos x))
(simplify (acos (- x)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (acos (- 2.0))
    (* (/ 1.0 2.0) pi)
    0.0
    pi
    (* (/ 1.0 3.0) pi)
    (* (/ 2.0 3.0) pi)
    (acos x)
    (acos (* (- 1.0) x))
---*)
