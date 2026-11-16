(*---
description: z3test's regression regressions/smt2/pat3.smt2.
ref: regressions/smt2/pat3.smt2
features:
  - z3test
outcome: unknown
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config false)
(set-option :smt.mbqi false)

(declare-fun p (Int) Bool)
(declare-const a Int)
(declare-const b Int)

(assert (forall ((x Int) (y Int)) (! (p (+ x y 2)) :pattern (p (+ x y 2)))))
(assert (forall ((x Int)) (! (p (+ x 2)) :pattern (p (+ x 2)))))
(assert (forall ((x Int)) (! (p (+ x 3)) :pattern (p (+ x 3)))))
(assert (p (+ a 2)))

(check-sat)
(push)
(assert (not (p (+ a 2))))
(check-sat)
(pop)
(check-sat)
(assert (not (p (+ a b 2))))
(check-sat)

(reset)
(set-option :auto-config true)
(declare-fun p (Int) Bool)
(declare-const a Int)
(declare-const b Int)

(assert (forall ((x Int) (y Int)) (! (p (+ x y 2)) :pattern (p (+ x y 2)))))
(assert (forall ((x Int)) (! (p (+ x 2)) :pattern (p (+ x 2)))))
(assert (forall ((x Int)) (! (p (+ x 3)) :pattern (p (+ x 3)))))
(assert (p (+ a 2)))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unknown
    unsat
    unknown
    unsat
    sat
---*)
