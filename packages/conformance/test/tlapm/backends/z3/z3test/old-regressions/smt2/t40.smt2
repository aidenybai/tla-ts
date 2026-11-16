(*---
description: z3test's regression old-regressions/smt2/t40.smt2.
ref: old-regressions/smt2/t40.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Int)

(simplify (<= (+ 3 (* 2 a)) 0)
                 :gcd-rounding true)

(simplify (<= (+ 3 (* 2 a)) (* 4 b))
                 :gcd-rounding true)

(simplify (<= (+ 3 (* 2 a)) (+ 2 (* 4 b) (* 6 c)))
                 :gcd-rounding true)

(simplify (>= (+ 3 (* 2 a)) (+ 2 (* 4 b) (* 6 c)))
                 :gcd-rounding true)

(simplify (>= (+ 6 (* 2 a)) (+ 1 (* 4 b) (* 6 c)))
                 :gcd-rounding true)

(simplify (<= (+ 6 (* 2 a)) (+ 1 (* 4 b) (* 6 c)))
                 :gcd-rounding true)

(simplify (<= (+ 6 (* 2 a)) (+ 1 (* 3 b) (* 6 c)))
                 :gcd-rounding true)

(simplify (<= (* 2 a) 3)
                 :gcd-rounding true)

(simplify (>= (* 2 a) 3)
                 :gcd-rounding true)

(simplify (<= 3 (* 2 a))
                 :gcd-rounding true)

(simplify (>= 3 (* 2 a))
                 :gcd-rounding true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (<= a (- 2))
    (<= a (+ (- 2) (* 2 b)))
    (<= a (+ (- 1) (* 2 b) (* 3 c)))
    (>= a (+ (* 2 b) (* 3 c)))
    (>= a (+ (- 2) (* 2 b) (* 3 c)))
    (<= a (+ (- 3) (* 2 b) (* 3 c)))
    (<= (* 2 a) (+ (- 5) (* 3 b) (* 6 c)))
    (<= a 1)
    (>= a 2)
    (>= a 2)
    (<= a 1)
---*)
