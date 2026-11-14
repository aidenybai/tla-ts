(*---
description: z3test's regression regressions/smt2/3799.smt2.
ref: regressions/smt2/3799.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic HORN)
(set-option :fp.engine bmc)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
