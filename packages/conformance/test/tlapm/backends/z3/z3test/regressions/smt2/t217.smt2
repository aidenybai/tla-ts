(*---
description: z3test's regression regressions/smt2/t217.smt2.
ref: regressions/smt2/t217.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



(simplify (root-obj 0 1))
(simplify (root-obj 1 1))
(simplify (root-obj x 2))
(simplify (root-obj x 1))
(simplify (root-obj (+ (* 2 x) 1) 1))
(simplify (root-obj (+ (* 2 x) 1) 2))
(simplify (root-obj (- (^ x 5) x 1) 1))
(set-option :pp.decimal true)
(simplify (root-obj (- (^ x 5) x 1) 1))
(simplify (root-obj (^ x 2) 1))
(simplify (root-obj (+ (^ x 2) 2)) 1)
(simplify (root-obj (+ (^ x 2) 2) 1))
(simplify (root-obj (+ (^ x 2) (- 2)) 1))
(simplify (root-obj (+ (^ x 2) (- 2)) 2))
(simplify (root-obj (+ (* 3 (^ x 2)) (- 2)) 2))
(set-option :pp.decimal false)
(simplify (root-obj (+ (* 3 (^ x 2)) (- 2)) 2))
(simplify (root-obj (+ (^ x 5) (* (- 1) x) (- 1)) 1))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 6 column 24: invalid root object, polynomial must not be the zero polynomial")
    (error "line 7 column 24: invalid root object, polynomial does have sufficient roots")
    (error "line 8 column 24: invalid root object, polynomial does have sufficient roots")
    0.0
    (- (/ 1.0 2.0))
    (error "line 11 column 36: invalid root object, polynomial does have sufficient roots")
    (root-obj (+ (^ x 5) (* (- 1) x) (- 1)) 1)
    1.1673039782?
    0.0
    (error "line 16 column 33: invalid root-obj, (unsigned) integer expected")
    (error "line 17 column 36: invalid root object, polynomial does have sufficient roots")
    (- 1.4142135623?)
    1.4142135623?
    0.8164965809?
    (root-obj (+ (* 3 (^ x 2)) (- 2)) 2)
    (root-obj (+ (^ x 5) (* (- 1) x) (- 1)) 1)
---*)
