(*---
description: z3test's regression regressions/smt2/issue-1725.smt2.
ref: regressions/smt2/issue-1725.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_S)
(declare-const x String)
(assert (str.contains (str.++ x "T1WT1t") "GWWT1W"))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
