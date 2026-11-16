(*---
description: z3test's regression regressions/smt2/nl40.smt2.
ref: regressions/smt2/nl40.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(assert
  (and
   (= (+ (* 11 a) (* 7 b)) 1)
   (= b (+ (* a c) (- 1)))
   (>= c a)
   (= b 0)
   ))
(check-sat)

(reset)

(set-logic QF_NIA)
(set-option :auto-config true)
(set-option :produce-models true)
(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(assert
  (and
   (= (+ (* 11 a) (* 7 b)) 1)
   (= b (+ (* a c) (- 1)))
   (>= c a)
   (= b 0)
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
