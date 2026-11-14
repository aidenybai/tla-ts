(*---
description: z3test's regression regressions/smt2/sine5.smt2.
ref: regressions/smt2/sine5.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)
(declare-const y Real)
(declare-const a Int)

(simplify (sin (+ x (* 2 pi) y)))
(simplify (sin (+ x (* (- 2) pi) y)))
(simplify (sin (+ x (* 4 pi) y)))
(simplify (sin (+ x (* (- 4) pi) y)))
(echo "....")

(simplify (sin (+ x (* 1 pi) y)))
(simplify (sin (+ x (* (- 1) pi) y)))
(simplify (sin (+ x (* 3 pi) y)))
(simplify (sin (+ x (* (- 3) pi) y)))
(echo "....")

(simplify (sin (+ x (* (/ 1 2) pi) y)))
(simplify (sin (+ x (* 2 pi) (* (/ 1 2) pi) y)))
(simplify (sin (+ x (* (- 2) pi) (* (/ 1 2) pi) y)))
(simplify (sin (+ x (* (- 4) pi) (* (/ 1 2) pi) y)))
(echo "....")

(simplify (sin (+ x (* (/ 3 2) pi) y)))
(simplify (sin (+ x (* 2 pi) (* (/ 3 2) pi) y)))
(simplify (sin (+ x (* (- 2) pi) (* (/ 3 2) pi) y)))
(simplify (sin (+ x (* (- 4) pi) (* (/ 3 2) pi) y)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (sin (+ x y))
    (sin (+ x y))
    (sin (+ x y))
    (sin (+ x y))
    ....
    (* (- 1.0) (sin (+ x y)))
    (* (- 1.0) (sin (+ x y)))
    (* (- 1.0) (sin (+ x y)))
    (* (- 1.0) (sin (+ x y)))
    ....
    (cos (+ x y))
    (cos (+ x y))
    (cos (+ x y))
    (cos (+ x y))
    ....
    (* (- 1.0) (cos (+ x y)))
    (* (- 1.0) (cos (+ x y)))
    (* (- 1.0) (cos (+ x y)))
    (* (- 1.0) (cos (+ x y)))
---*)
