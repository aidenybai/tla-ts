(*---
description: z3test's regression regressions/smt2/z3.31.smt2.
ref: regressions/smt2/z3.31.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(declare-const a (Array Int Int))
(declare-const x Int)
(declare-const y Int)
(display  (+ x 2 x 1))
(simplify (+ x 2 x 1))
(simplify (* (+ x y) (+ x y)))
(simplify (* (+ x y) (+ x y)) :som true) ; put all expressions in sum-of-monomials form.
(simplify (= x (+ y 2)) :arith-lhs true)
(simplify (= (store (store a 1 2) 4 3)
             (store (store a 4 3) 1 2)))
(simplify (= (store (store a 1 2) 4 3)
             (store (store a 4 3) 1 2))
          :sort-store true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (+ x 2 x 1)
    (+ 3 (* 2 x))
    (* (+ x y) (+ x y))
    (+ (* x x) (* 2 x y) (* y y))
    (= (+ x (* (- 1) y)) 2)
    (= (store (store a 1 2) 4 3) (store (store a 4 3) 1 2))
    true
---*)
