(*---
description: z3test's regression regressions/smt2/3959.smt2.
ref: regressions/smt2/3959.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const a Bool)
(check-sat-assuming (a (or true)))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
