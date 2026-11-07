(*---
description: z3test's regression regressions/smt2/t131.smt2.
ref: regressions/smt2/t131.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :smtlib2-compliant true)
(set-logic QF_RDL)

(declare-fun x () Int)
(declare-fun y () Real)
(declare-fun z () (List Int))
(declare-fun w () (Array Int Int))
(declare-fun f (Real) Real)
(declare-fun z () Real)

(assert (>= (* 2 y) 2))
(assert (<= (- y z) 1)) 
(assert (>= y z))
(assert (= y z))
(assert (<= (- z y) 2))
(assert (<= (- (+ z z) (+ y y)) 2))
(assert (<= (- (+ z z z) (+ y y)) 2))
(assert (<= (- (+ z y) (+ y y)) 2))
(assert (or (= y z) (<= y z)))
(assert (distinct y z))
(assert (distinct y (+ 2 z)))
(assert (distinct (- y 3) (+ 2 z)))
(assert (<= (- z y) (/ 2 3)))
(assert (<= (- z y) (/ 2 y)))
(assert (= (* y y) 2))

(declare-fun x () (_ BitVec 32))
(assert (<= (- z y) (- (/ 2 3))))

(assert (<= (- (ite true y (+ y 1)) (ite false z (+ z 2))) (- 3)))

(assert (<= (- z y) (to_real 2)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    success
    success
    (error "line 6 column 21: logic does not support integers")
    success
    (error "line 8 column 19: unknown sort 'List'")
    (error "line 9 column 19: unknown sort 'Array'")
    (error "line 10 column 26: logic does not support uninterpreted functions")
    success
    (error "line 13 column 22: logic only supports difference arithmetic")
    success
    success
    success
    success
    success
    (error "line 19 column 36: logic only supports difference arithmetic")
    (error "line 20 column 34: logic only supports difference arithmetic")
    success
    success
    success
    success
    success
    (error "line 26 column 28: logic does not support nonlinear arithmetic")
    (error "line 27 column 21: logic does not support nonlinear arithmetic")
    (error "line 29 column 28: unknown sort 'BitVec'")
    success
    success
    (error "line 34 column 32: logic does not support casting operators")
---*)
