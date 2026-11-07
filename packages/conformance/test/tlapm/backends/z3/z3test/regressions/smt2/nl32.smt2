(*---
description: z3test's regression regressions/smt2/nl32.smt2.
ref: regressions/smt2/nl32.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(echo "ACL2 example")
(set-option :pp.decimal true)
(set-option :auto-config false)
(set-option :produce-models true)
(declare-const a Real)
(declare-const b Real)
(assert
  (and
   (<= 0.0 a)
   (< a b)
   (not (<= (+ a 1.0) (+ (* a b) b)))
   ))
(check-sat)

(reset)
(set-logic QF_NRA)
(set-option :auto-config true)
(set-option :produce-models true)
(set-option :pp.max-depth 100)
(declare-const a Real)
(declare-const b Real)
(assert
  (and
   (<= 0.0 a)
   (< a b)
   (not (<= (+ a 1.0) (+ (* a b) b)))
   ))
(check-sat)

(reset)
(set-option :auto-config false)
(set-option :produce-models true)
(declare-const a Int)
(declare-const b Int)
(assert
  (and
   (<= 0 a)
   (< a b)
   (not (<= (+ a 1) (+ (* a b) b)))
   ))
(check-sat)

(reset)
(set-logic QF_NIA)
(set-option :auto-config true)
(set-option :produce-models true)
(set-option :pp.max-depth 100)
(declare-const a Int)
(declare-const b Int)
(assert
  (and
   (<= 0 a)
   (< a b)
   (not (<= (+ a 1) (+ (* a b) b)))
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    ACL2 example
    sat
    sat
    unsat
    unsat
---*)
