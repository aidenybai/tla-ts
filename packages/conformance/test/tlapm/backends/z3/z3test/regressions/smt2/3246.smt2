(*---
description: z3test's regression regressions/smt2/3246.smt2.
ref: regressions/smt2/3246.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const v1 Bool)
(declare-const v2 Bool)
(declare-const v4 Bool)
(declare-const v5 Bool)
(declare-const v6 Bool)
(declare-const v8 Bool)
(declare-const v11 Bool)
(assert (or (> (mod 0 0) 0) (xor v4 v2 (= v1 v4 true) v11 v5 true v11 true false false)))
(assert (or (xor v4 true v1 false true true v6 false v2) (or (or (= v1 v4 true) v8) (xor v4 v2 (= v1 v4 true) v11 v5 v4 v11 true true false) v6)))
(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
