(*---
description: z3test's regression regressions/smt2/4044.smt2.
ref: regressions/smt2/4044.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun s () String)
(assert (distinct (str.suffixof "B" (str.++ s "B")) (= s "")))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
