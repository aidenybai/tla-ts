(*---
description: z3test's regression regressions/smt2/4009.smt2.
ref: regressions/smt2/4009.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(declare-fun a () String)
(declare-fun b () String)
(declare-fun c () String)
(assert (distinct a b))
(assert (distinct c (str.++ b "aaaaaaaaaaaaa")))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
