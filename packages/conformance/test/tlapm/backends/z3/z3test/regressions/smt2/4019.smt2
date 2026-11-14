(*---
description: z3test's regression regressions/smt2/4019.smt2.
ref: regressions/smt2/4019.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () String)
(assert (= "" (str.replace "" a "B")))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
