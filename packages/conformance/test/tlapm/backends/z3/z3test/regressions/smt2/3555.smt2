(*---
description: z3test's regression regressions/smt2/3555.smt2.
ref: regressions/smt2/3555.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.clause_proof true)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(assert (= (< c a) (< 0 b)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
