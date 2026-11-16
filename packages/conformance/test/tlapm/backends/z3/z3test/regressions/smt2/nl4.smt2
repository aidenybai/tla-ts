(*---
description: z3test's regression regressions/smt2/nl4.smt2.
ref: regressions/smt2/nl4.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const x1 Real)
(assert (< (* x1 x1) 0.0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
