(*---
description: z3test's regression regressions/smt2/issue-3028.smt2.
ref: regressions/smt2/issue-3028.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun t () Int)
(assert (> t (bv2nat ((_ int2bv 1) t))))
(check-sat-using (then qfidl smt))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
