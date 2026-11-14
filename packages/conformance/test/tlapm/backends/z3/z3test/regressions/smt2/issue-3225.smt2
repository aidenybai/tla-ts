(*---
description: z3test's regression regressions/smt2/issue-3225.smt2.
ref: regressions/smt2/issue-3225.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :nlsat.inline_vars true)
(assert (distinct (/ 40  (^ 0.375 210)) (^ 0 4.0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
