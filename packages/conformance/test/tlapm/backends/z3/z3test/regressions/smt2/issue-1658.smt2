(*---
description: z3test's regression regressions/smt2/issue-1658.smt2.
ref: regressions/smt2/issue-1658.smt2
features:
  - z3test
outcome: unsat
---*)
; Copyright (c) 2016 Microsoft Corporation
; GitHub issue

(assert (forall ((x Real))
        (exists ((y Real))
                (and (<= 0.0 y) (<= y 1.0) (<= x (* y y))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
