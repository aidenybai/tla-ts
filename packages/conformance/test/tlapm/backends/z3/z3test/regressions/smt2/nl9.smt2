(*---
description: z3test's regression regressions/smt2/nl9.smt2.
ref: regressions/smt2/nl9.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :produce-models true)
(declare-const x1 Int)
(declare-const x2 Int)
(assert
  (and
   (> x1 0)
   (> (* x1 x2) 0)
   (< x1 0)
   ))
(check-sat)

(reset)
(set-logic QF_NIA)
(set-option :auto-config true)
(set-option :produce-models true)
(declare-const x1 Int)
(declare-const x2 Int)
(assert
  (and
   (> x1 0)
   (> (* x1 x2) 0)
   (< x1 0)
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
