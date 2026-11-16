(*---
description: z3test's regression regressions/smt2/string12.smt2.
ref: regressions/smt2/string12.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2017 Microsoft Corporation
; issue #731
(declare-fun c0 () Int)
(assert (not (= c0 (str.to.int (int.to.str c0)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
