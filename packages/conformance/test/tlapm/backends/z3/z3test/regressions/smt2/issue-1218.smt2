(*---
description: z3test's regression regressions/smt2/issue-1218.smt2.
ref: regressions/smt2/issue-1218.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic ALL)
(set-option :model_validate true)
(declare-const s1 String)
(declare-const s2 String)
(declare-const s3 String)
(assert (= ( str.replace s1 s2 s3 ) s3))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
