(*---
description: z3test's regression regressions/smt2/nl50.smt2.
ref: regressions/smt2/nl50.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :produce-models true)
(declare-const x Real)
(declare-const a Real)
(declare-const b Real)
(assert
  (and
   (< 2.0 x)
   (<= a (+ x b))
   (not (< a (+ (* x x) b)))
   ))
(check-sat)

(reset)
(set-logic QF_NRA)
(set-option :produce-models true)
(set-option :auto-config true)
(declare-const x Real)
(declare-const a Real)
(declare-const b Real)
(assert
  (and
   (< 2.0 x)
   (<= a (+ x b))
   (not (< a (+ (* x x) b)))
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
