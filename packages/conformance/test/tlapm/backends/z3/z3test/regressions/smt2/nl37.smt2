(*---
description: z3test's regression regressions/smt2/nl37.smt2.
ref: regressions/smt2/nl37.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :pp.decimal true)
(declare-const x Int)
(declare-const y Int)
(push)
(assert
  (and
   (= (* x y) 0)
   (not (= x 0))
   (not (= y 0))))
(check-sat)
(pop)
(check-sat)
(assert (= (* x x) 2))
(check-sat)

(reset)

(declare-const x Real)
(declare-const y Real)
(assert
  (and
   (= (* x y) 0.0)
   (not (= x 0.0))
   (not (= y 0.0))))
(check-sat)

(reset)
(set-logic QF_NIA)
(set-option :auto-config true)
(set-option :produce-models true)
(declare-const x Int)
(declare-const y Int)
(assert
  (and
   (= (* x y) 0)
   (not (= x 0))
   (not (= y 0))))
(check-sat)

(reset)

(set-logic QF_NIA)
(set-option :auto-config true)
(set-option :produce-models true)
(declare-const x Int)
(assert (= (* x x) 2))
(check-sat)

(reset)

(set-logic QF_NRA)
(set-option :auto-config true)
(set-option :produce-models true)
(declare-const x Real)
(assert (= (* x x) 2.0))
(assert (< x 0.0))
(check-sat)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    sat
    unsat
    unsat
    unsat
    unsat
    sat
    (
      (define-fun x () Real
        (- 1.4142135623?))
    )
---*)
