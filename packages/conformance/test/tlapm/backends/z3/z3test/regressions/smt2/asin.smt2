(*---
description: z3test's regression regressions/smt2/asin.smt2.
ref: regressions/smt2/asin.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)

(simplify (asin (- x)))
(simplify (asin (- 2)))
(simplify (asin 1))
(simplify (asin 0))
(simplify (asin (- 1)))
(simplify (asin (/ 1 2)))
(simplify (+ pi (asin (- (/ 1 2)))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (* (- 1.0) (asin x))
    (* (- 1.0) (asin 2.0))
    (* (/ 1.0 2.0) pi)
    0.0
    (* (- (/ 1.0 2.0)) pi)
    (* (/ 1.0 6.0) pi)
    (* (/ 5.0 6.0) pi)
---*)
