(*---
description: z3test's regression regressions/smt2/nl5.smt2.
ref: regressions/smt2/nl5.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const x1 Real)
(declare-const x2 Real)
(assert
  (and
   (> x1 0.0)
   (> x2 0.0)
   (< (* x1 x2) 0.0)
   ))
(check-sat)

(reset)
(set-option :auto-config true)
(declare-const x1 Real)
(declare-const x2 Real)
(assert
  (and
   (> x1 0.0)
   (> x2 0.0)
   (< (* x1 x2) 0.0)
   ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
