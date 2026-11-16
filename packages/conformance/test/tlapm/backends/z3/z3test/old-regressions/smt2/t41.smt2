(*---
description: z3test's regression old-regressions/smt2/t41.smt2.
ref: old-regressions/smt2/t41.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Int)

(simplify (= 3 (* 2 a))
                 :gcd-rounding true)

(simplify (= 3 (* 2 a)))

(simplify (= (* 2 a) 3)
                 :gcd-rounding true)

(simplify (= (* 2 a) 4)
                 :gcd-rounding true)

(simplify (= (* 2 a) (+ a a a a a 4))
                 :gcd-rounding true)
(simplify (= (* 2 a) (+ a a a a a a 4))
                 :gcd-rounding true)
(simplify (= (+ (* 2 a) 4) (+ a a a a a a))
                 :gcd-rounding true)
(simplify (= (+ (* 2 a) 4) (+ a a a a a a))
                 :gcd-rounding true
                 :arith-lhs true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    false
    false
    false
    (= a 2)
    false
    (= a (- 1))
    (= a 1)
    (= a 1)
---*)
