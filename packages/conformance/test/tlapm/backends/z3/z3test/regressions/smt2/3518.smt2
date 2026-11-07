(*---
description: z3test's regression regressions/smt2/3518.smt2.
ref: regressions/smt2/3518.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(declare-const v3 Bool)
(declare-const v4 Bool)
(declare-const r1 Real)
(declare-const r5 Real)
(declare-const r6 Real)
(declare-const v7 Bool)
(assert (and v4 v7 (>= r6 4488880046.0 (/ r5 0.0) r1 r1) v3 v7))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
