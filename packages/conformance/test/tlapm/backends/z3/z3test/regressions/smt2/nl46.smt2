(*---
description: z3test's regression regressions/smt2/nl46.smt2.
ref: regressions/smt2/nl46.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const x1 Int)
(declare-const x2 Int)
(declare-const x3 Int)
(assert
  (and
   (<= x1 2)
   (<= 2 x1)
   (<= (* x1 x2) 3)
   (>= x2 2)
   (> (* x1 x2 x3) 10)
   (> (* x1 x1 x2) 10)
   (> (* x1 x2 x2) 10)
   (<= (* x1 x1 x1) 8)
   ))
(check-sat)


(reset)
(set-logic QF_NIA)
(set-option :auto-config true)
(declare-const x1 Int)
(declare-const x2 Int)
(declare-const x3 Int)
(assert
  (and
   (<= x1 2)
   (<= 2 x1)
   (<= (* x1 x2) 3)
   (>= x2 2)
   (> (* x1 x2 x3) 10)
   (> (* x1 x1 x2) 10)
   (> (* x1 x2 x2) 10)
   (<= (* x1 x1 x1) 8)
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
