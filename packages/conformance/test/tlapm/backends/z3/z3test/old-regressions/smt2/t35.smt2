(*---
description: z3test's regression old-regressions/smt2/t35.smt2.
ref: old-regressions/smt2/t35.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Int)
(declare-const r1 Real)
(declare-const r2 Real)
(set-option :pp.flat-assoc false)

(simplify (- a b))
(simplify (- a))
(simplify (- (+ a b)))
(simplify (- 0 a))
(simplify (- 1 2))
(simplify (- 2 2))
(simplify (- (+ a b c c)))
(simplify (let ((l1 (+ a a)))
                 (let ((l2 (+ l1 l1)))
                 (let ((l3 (+ l2 l2)))
                 (let ((l4 (+ l3 l3)))
                 (let ((l5 (+ l4 l4)))
                 (let ((l6 (+ l5 l5)))
                 (let ((l7 (+ l6 l6)))
                 (let ((l8 (+ l7 l7)))
                 (let ((l9 (+ l8 l8)))
                 (let ((l10 (+ l9 l9)))
                 (let ((l11 (+ l10 l10)))
                 (let ((l12 (+ l11 l11)))
                 (let ((l13 (+ l12 l12)))
                 (let ((l14 (+ l13 l13)))
                 (let ((l15 (+ l14 l14)))
                 (let ((l16 (+ l15 l15)))
                 (let ((l17 (+ l16 l16)))
                 (let ((l18 (+ l17 l17)))
                 (let ((l19 (+ l18 l18)))
                 (let ((l20 (+ l19 l19)))
                   l20)))))))))))))))))))))

(simplify (- 3 (+ 2 3)))
(simplify (+ a b a a c))
(simplify (+ a a a a c))
(simplify (+ a a a a b b b))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (+ a (* (- 1) b))
    (* (- 1) a)
    (+ (* (- 1) a) (* (- 1) b))
    (* (- 1) a)
    (- 1)
    0
    (+ (* (- 1) a) (* (- 1) b) (* (- 2) c))
    (* 1048576 a)
    (- 2)
    (+ (* 3 a) b c)
    (+ (* 4 a) c)
    (+ (* 4 a) (* 3 b))
---*)
