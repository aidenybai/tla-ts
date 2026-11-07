(*---
description: z3test's regression regressions/smt2/sine8.smt2.
ref: regressions/smt2/sine8.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)
(declare-const y Real)
(declare-const a Int)
(declare-const b Int)

(simplify (sin (+ x (* 2 pi) y (* 2 (to_real a) pi) (* 2 pi (to_real b)))))
(simplify (sin (+ x (* 2 pi) y (* 6 (to_real a) pi) (* 8 pi (to_real b)))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (sin (+ x y))
    (sin (+ x y))
---*)
