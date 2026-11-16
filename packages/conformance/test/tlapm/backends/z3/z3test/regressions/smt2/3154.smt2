(*---
description: z3test's regression regressions/smt2/3154.smt2.
ref: regressions/smt2/3154.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic NRA)
(set-option :nlsat.inline_vars true)
(declare-const v2 Bool)
(declare-const v4 Bool)
(declare-const r1 Real)
(declare-const r4 Real)
(declare-const r8 Real)
(assert (=> v4 v2))
(assert (= (* 17 r8 6340602.091 r1 0.231076) r4 0.6 r1 (* 17 r8 6340602.091 r1 0.231076)))
(assert v4)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
