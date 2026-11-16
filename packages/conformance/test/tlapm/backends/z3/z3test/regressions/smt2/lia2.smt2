(*---
description: z3test's regression regressions/smt2/lia2.smt2.
ref: regressions/smt2/lia2.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :smt-lib-version 2.0)
(assert (forall (( x Int)) (forall ((y Int)) (= y x))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
