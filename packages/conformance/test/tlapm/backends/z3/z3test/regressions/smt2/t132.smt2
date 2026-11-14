(*---
description: z3test's regression regressions/smt2/t132.smt2.
ref: regressions/smt2/t132.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-logic QF_AUFLIA)

(declare-fun x () Int)
(declare-fun y () Real)
(declare-fun a () (Array Int Int))
(declare-fun bv () (_ BitVec 32))
(declare-fun f (Int) Int)
(declare-fun y () Int)

(assert (= (* x x) 2))
(assert (= (* 2 x 3) (+ y 2 y)))
(assert (>= (div 2 x) 3))
(assert (forall ((x Int)) (= (f x) x)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 8 column 22: logic does not support reals")
    (error "line 10 column 29: unknown sort 'BitVec'")
    (error "line 14 column 21: logic does not support nonlinear arithmetic")
    (error "line 16 column 24: logic does not support nonlinear arithmetic")
    (error "line 17 column 38: logic does not support quantifiers")
---*)
