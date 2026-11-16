(*---
description: z3test's regression regressions/smt2/issue-1608.smt2.
ref: regressions/smt2/issue-1608.smt2
features:
  - z3test
outcome: unsat
---*)
; Copyright (c) 2018 Microsoft Corporation
; GitHub issue

(declare-const x Real)
(assert (is_int x))
(assert (not (is_int (+ x 1))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
