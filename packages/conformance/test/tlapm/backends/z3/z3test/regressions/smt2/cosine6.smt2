(*---
description: z3test's regression regressions/smt2/cosine6.smt2.
ref: regressions/smt2/cosine6.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)
(declare-const y Real)
(declare-const a Int)

(simplify (cos (+ x (* 2 pi) y (* 2 pi (to_real a)))))
(simplify (cos (+ x (* 2 pi) y (* 4 pi (to_real a)))))
(simplify (cos (+ x (* 2 pi) y (* (- 4) pi (to_real a)))))
(simplify (cos (+ x (* 2 pi) y (* (- 2) pi (to_real a)))))
(simplify (cos (+ x (* 2 pi) y (* pi (to_real a)))))

(simplify (cos (+ x (* 2 pi) y (* 2 (to_real a) pi))))
(simplify (cos (+ x (* 2 pi) y (* 4 (to_real a) pi))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (cos (+ x y))
    (cos (+ x y))
    (cos (+ x y))
    (cos (+ x y))
    (cos (+ x y (* pi (to_real a))))
    (cos (+ x y))
    (cos (+ x y))
---*)
