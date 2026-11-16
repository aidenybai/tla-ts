(*---
description: z3test's regression regressions/smt2/3775.smt2.
ref: regressions/smt2/3775.smt2
features:
  - z3test
outcome: sat
---*)
(assert (distinct (lambda ((a Int)) 0)))
(check-sat-using horn)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
