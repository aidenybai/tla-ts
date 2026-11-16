(*---
description: z3test's regression regressions/smt2/issue-3023.smt2.
ref: regressions/smt2/issue-3023.smt2
features:
  - z3test
outcome: unknown
---*)
(declare-fun a () Int)
(assert (distinct a (str.to.int (int.to.str a))))
(check-sat-using fix-dl-var)

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
