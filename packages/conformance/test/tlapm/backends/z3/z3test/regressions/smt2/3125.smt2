(*---
description: z3test's regression regressions/smt2/3125.smt2.
ref: regressions/smt2/3125.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_BV)
(set-option :sat.local_search true)
(declare-const v2 Bool)
(assert v2)
(declare-const v11 Bool)
(assert v11)
(check-sat-using (then simplify purify-arith bit-blast sat))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
