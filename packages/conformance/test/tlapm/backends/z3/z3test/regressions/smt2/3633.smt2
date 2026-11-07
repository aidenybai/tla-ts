(*---
description: z3test's regression regressions/smt2/3633.smt2.
ref: regressions/smt2/3633.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic LIA)
(set-option :proof true)
(declare-const i6 Int)
(assert (not (exists ((q7 Int)) (not (<= q7 i6)))))
(check-sat-using qfufbv_ackr)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
