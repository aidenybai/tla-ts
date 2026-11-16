(*---
description: z3test's regression regressions/smt2/string7.smt2.
ref: regressions/smt2/string7.smt2
features:
  - z3test
outcome: unsat
---*)
; Copyright (c) 2017 Microsoft Corporation
; Github issue #812
(declare-fun c0 () String)
(declare-fun c1 () Int)
(declare-fun c2 () Int)
(assert (not (str.contains c0 (str.substr c0 c1 (- c2 c1)))))
(assert (and (<= 0 c1) (<= c1 c2) (<= c2 (str.len c0))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
