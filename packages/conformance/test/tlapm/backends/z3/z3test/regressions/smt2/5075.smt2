(*---
description: z3test's regression regressions/smt2/5075.smt2.
ref: regressions/smt2/5075.smt2
features:
  - z3test
outcome: any
---*)
(declare-const i Int)
(minimize i)

(*--- recorded
all:
  exit: 0
---*)
