(*---
description: z3test's regression regressions/smt2/2852.smt2.
ref: regressions/smt2/2852.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun a () String)
(assert (distinct (str.prefixof a (str.substr a 1 2)) (= a (str.at a 2))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
