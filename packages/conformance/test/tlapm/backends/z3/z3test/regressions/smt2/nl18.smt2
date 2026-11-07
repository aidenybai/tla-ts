(*---
description: z3test's regression regressions/smt2/nl18.smt2.
ref: regressions/smt2/nl18.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :produce-models true)
(declare-const x1 Int)
(declare-fun f (Int) Int)
(assert
  (and
   (= (* x1 x1) 1)
   (= (f 1)  0)
   (= (f (- 1)) 0)
   ))
(check-sat)
(eval (or (= x1 1) (= x1 -1)))
(assert (not (= x1 1)))
(check-sat)
(eval x1)
(assert (not (= x1 (- 1))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    true
    sat
    (- 1)
    unsat
---*)
