(*---
description: z3test's regression regressions/smt2/issue-3038.smt2.
ref: regressions/smt2/issue-3038.smt2
features:
  - z3test
outcome: unknown
---*)
(declare-fun a () Real)
(assert (distinct (^ a 0.0) 1.0))
(check-sat-using nlqsat)

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
