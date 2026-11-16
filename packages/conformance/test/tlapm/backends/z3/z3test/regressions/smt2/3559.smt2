(*---
description: z3test's regression regressions/smt2/3559.smt2.
ref: regressions/smt2/3559.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic QF_BV)
(set-option :trace true)
(assert (distinct true true true true true true true true (distinct (bvsub (_ bv480 9) (_ bv480 9)) (_ bv0 9) (_ bv480 9) (_ bv480 9))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
