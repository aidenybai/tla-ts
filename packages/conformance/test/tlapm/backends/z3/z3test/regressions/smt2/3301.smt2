(*---
description: z3test's regression regressions/smt2/3301.smt2.
ref: regressions/smt2/3301.smt2
features:
  - z3test
outcome: sat
---*)
(check-sat (not false))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
