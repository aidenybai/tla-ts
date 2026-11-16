(*---
description: z3test's regression regressions/smt2/coercions.smt2.
ref: regressions/smt2/coercions.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(get-option :int-real-coercions)

(declare-const x Int)
(declare-fun p (Real) Bool)
(declare-const a (Array Real Bool))
(declare-const b (Array Int Bool))
(declare-const y Real)
(declare-const l1 (List Int))
(declare-const l2 (List Real))
(declare-const q Bool)
(declare-fun f (Int) Bool)

(simplify (p x))
(simplify (select a x))
(simplify (select a q))
(simplify (select b y))
(simplify (store a x true))
(simplify (store b x true))
(simplify (store b y true))
(simplify (insert y l2))
(simplify (+ x y))
(simplify (+ x 1))
(simplify (+ y 1))
(simplify (+ x y 10))
(simplify (< x y))
(display (< x y))
(simplify (/ x y))
(simplify (div x y))
(simplify (f (+ x 1.0)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    (p (to_real x))
    (select a (to_real x))
    (error "line 17 column 21: domain sort Bool and parameter Real do not match")
    (select b (to_int y))
    (store a (to_real x) true)
    (store b x true)
    (store b (to_int y) true)
    (insert y l2)
    (+ (to_real x) y)
    (+ 1 x)
    (+ 1.0 y)
    (+ 10.0 (to_real x) y)
    (not (<= y (to_real x)))
    (< (to_real x) y)
    (/ (to_real x) y)
    (div x (to_int y))
    (f (+ 1 x))
---*)
