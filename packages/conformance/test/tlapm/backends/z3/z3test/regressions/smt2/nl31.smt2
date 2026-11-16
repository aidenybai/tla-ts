(*---
description: z3test's regression regressions/smt2/nl31.smt2.
ref: regressions/smt2/nl31.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(echo "ACL2 example")
(set-option :auto-config false)
(set-option :produce-models true)
(declare-const x Real)
(declare-const y Real)
(declare-const a Real)
(assert
  (and
   (< (+ (* 3.0 x y) (* 7.0 a)) 4.0)
   (< 3.0 (* 2.0 x))
   (< 1.0 y)
   (not (< a 0.0))
   ))
(check-sat)

(reset)
(set-logic QF_NRA)
(set-option :auto-config true)
(set-option :produce-models true)
(set-option :pp.max-depth 100)
(declare-const x Real)
(declare-const y Real)
(declare-const a Real)
(assert
  (and
   (< (+ (* 3.0 x y) (* 7.0 a)) 4.0)
   (< 3.0 (* 2.0 x))
   (< 1.0 y)
   (not (< a 0.0))
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    ACL2 example
    unsat
    unsat
---*)
