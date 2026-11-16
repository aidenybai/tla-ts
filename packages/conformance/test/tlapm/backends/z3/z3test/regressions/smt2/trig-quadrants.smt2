(*---
description: z3test's regression regressions/smt2/trig-quadrants.smt2.
ref: regressions/smt2/trig-quadrants.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2016 Microsoft Corporation
(set-info :source |Written by D. B. Staple for GitHub issue #680.|)
(set-info :status sat)

(set-option :pp.decimal true)
(set-option :model_validate true)

; pi / 4
(define-fun sqrt2over2 () Real (root-obj (+ (* 2 (^ x 2)) (- 1)) 2))
(declare-fun theta () Real)
(assert (= (cos theta) sqrt2over2))
(assert (= (sin theta) sqrt2over2))
(check-sat-using qfnra-nlsat)
(get-model)
(reset)

; 3 * pi / 4
(define-fun sqrt2over2 () Real (root-obj (+ (* 2 (^ x 2)) (- 1)) 2))
(declare-fun theta () Real)
(assert (= (cos theta) (- sqrt2over2)))
(assert (= (sin theta) sqrt2over2))
(check-sat-using qfnra-nlsat)
(get-model)
(reset)

; 5 * pi / 4
(define-fun sqrt2over2 () Real (root-obj (+ (* 2 (^ x 2)) (- 1)) 2))
(declare-fun theta () Real)
(assert (= (cos theta) (- sqrt2over2)))
(assert (= (sin theta) (- sqrt2over2)))
(check-sat-using qfnra-nlsat)
(get-model)
(reset)

; 7 * pi / 4
(define-fun sqrt2over2 () Real (root-obj (+ (* 2 (^ x 2)) (- 1)) 2))
(declare-fun theta () Real)
(assert (= (cos theta) sqrt2over2))
(assert (= (sin theta) (- sqrt2over2)))
(check-sat-using qfnra-nlsat)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (
      (define-fun theta () Real
        (acos 0.7071067811?))
      (define-fun sqrt2over2 () Real
        0.7071067811?)
    )
    sat
    (
      (define-fun theta () Real
        (acos (- 0.7071067811?)))
      (define-fun sqrt2over2 () Real
        0.7071067811?)
    )
    sat
    (
      (define-fun theta () Real
        (+ (acos 0.7071067811?) pi))
      (define-fun sqrt2over2 () Real
        0.7071067811?)
    )
    sat
    (
      (define-fun theta () Real
        (+ (acos (- 0.7071067811?)) pi))
      (define-fun sqrt2over2 () Real
        0.7071067811?)
    )
---*)
