(*---
description: z3test's regression regressions/smt2/3644.smt2.
ref: regressions/smt2/3644.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic LIA)
(declare-const v1 Bool)
(declare-const v2 Bool)
(declare-const i1 Int)
(push 1)
(assert (forall ((q14 Bool)) (not (and q14 q14 (= (mod 26 (abs 26)) (div i1 26)) v1 v2 q14 q14))))
(check-sat-using (then qe-light qflia))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
