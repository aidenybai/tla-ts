(*---
description: z3test's regression regressions/smt2/nl38.smt2.
ref: regressions/smt2/nl38.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Int)
(assert
  (and
   (< 0 (* a b))
   (< 0 (* c d))
   (< 0 (* a c))
   (not (< 0 (* b d)))
   ))
(check-sat)

(reset)

(set-logic QF_NIA)
(set-option :auto-config true)
(set-option :produce-models true)
(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Int)
(assert
  (and
   (< 0 (* a b))
   (< 0 (* c d))
   (< 0 (* a c))
   (not (< 0 (* b d)))
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
