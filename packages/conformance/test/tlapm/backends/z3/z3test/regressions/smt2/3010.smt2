(*---
description: z3test's regression regressions/smt2/3010.smt2.
ref: regressions/smt2/3010.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Real)
(assert (< 0.0 a 1.9))
(check-sat-using qflia)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
