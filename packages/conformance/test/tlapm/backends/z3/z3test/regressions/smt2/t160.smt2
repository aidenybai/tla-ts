(*---
description: z3test's regression regressions/smt2/t160.smt2.
ref: regressions/smt2/t160.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-logic QF_NRA)
(declare-const a Real)
(assert (= (* a a) 3))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
