(*---
description: z3test's regression regressions/smt2/4010.smt2.
ref: regressions/smt2/4010.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(declare-fun a () Int)
(declare-fun b () String)
(declare-fun c () String)
(declare-fun d () String)
(assert (<= 20 a))
(assert (= d (str.++ b c)))
(assert (= a (str.len d)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
