(*---
description: z3test's regression regressions/smt2/3006.smt2.
ref: regressions/smt2/3006.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () (Array Int (Array Int Int)))
(assert (= a (store a 0 (store (select a 0) 0 0))))
(check-sat-using qsat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
