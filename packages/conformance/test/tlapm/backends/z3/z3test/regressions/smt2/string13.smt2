(*---
description: z3test's regression regressions/smt2/string13.smt2.
ref: regressions/smt2/string13.smt2
features:
  - z3test
outcome: unsat
---*)
; Copyright (c) 2017 Microsoft Corporation
; issue #875
(declare-fun c0 () String)
(declare-fun c1 () String)
(declare-fun c2 () Int)
(assert (<= 0 (str.indexof c0 c1 c2)))
(assert (not (str.contains c0 c1)))
(assert (< c2 (str.len c0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
