(*---
description: z3test's regression regressions/smt2/sine6.smt2.
ref: regressions/smt2/sine6.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)
(declare-const y Real)
(declare-const a Int)

(simplify (sin (+ x (* 2 pi) y (* 2 pi (to_real a)))))
(simplify (sin (+ x (* 2 pi) y (* 4 pi (to_real a)))))
(simplify (sin (+ x (* 2 pi) y (* (- 4) pi (to_real a)))))
(simplify (sin (+ x (* 2 pi) y (* (- 2) pi (to_real a)))))
(simplify (sin (+ x (* 2 pi) y (* pi (to_real a)))))

(simplify (sin (+ x (* 2 pi) y (* 2 (to_real a) pi))))
(simplify (sin (+ x (* 2 pi) y (* 4 (to_real a) pi))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (sin (+ x y))
    (sin (+ x y))
    (sin (+ x y))
    (sin (+ x y))
    (sin (+ x y (* pi (to_real a))))
    (sin (+ x y))
    (sin (+ x y))
---*)
