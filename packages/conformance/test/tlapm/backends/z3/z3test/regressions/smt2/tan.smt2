(*---
description: z3test's regression regressions/smt2/tan.smt2.
ref: regressions/smt2/tan.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :numeral-as-real true)
(set-option :pp.decimal true)
(declare-const x Real)
(declare-const y Real)
(declare-const a Int)
(declare-const b Int)

(simplify (tan 0))
(simplify (tan (* (/ 1 3) pi)))
(simplify (tan (* (/ 1 6) pi)))
(simplify (tan (* (/ 5 6) pi)))
(simplify (tan (* (/ 1 4) pi)))
(simplify (tan (* (/ 3 4) pi)))
(simplify (tan (* (/ 2 3) pi)))
(simplify (tan (* (/ 1 12) pi)))
(simplify (tan (* (/ 5 12) pi)))
(simplify (tan (* (/ 11 12) pi)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    0.0
    1.7320508075?
    0.5773502691?
    (- 0.5773502691?)
    1.0
    (- 1.0)
    (- 1.7320508075?)
    0.2679491924?
    3.7320508075?
    (- 0.2679491924?)
---*)
