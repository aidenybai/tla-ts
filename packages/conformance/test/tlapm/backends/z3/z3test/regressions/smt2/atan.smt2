(*---
description: z3test's regression regressions/smt2/atan.smt2.
ref: regressions/smt2/atan.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)

(simplify (atan (- x)))
(simplify (atan (- 2)))
(simplify (atan 1))
(simplify (atan 0))
(simplify (atan (- 1)))
(simplify (atan (/ 1 2)))
(simplify (atan (* 2 x)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (* (- 1.0) (atan x))
    (* (- 1.0) (atan 2.0))
    (* (/ 1.0 4.0) pi)
    0.0
    (* (- (/ 1.0 4.0)) pi)
    (atan (/ 1.0 2.0))
    (atan (* 2.0 x))
---*)
