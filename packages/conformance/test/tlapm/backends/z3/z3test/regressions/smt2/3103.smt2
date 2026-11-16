(*---
description: z3test's regression regressions/smt2/3103.smt2.
ref: regressions/smt2/3103.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (forall ((a Real)) (exists ((b Real)) (and (>= (+ a b) 0.0) (<= b 0.0)))))
(check-sat-using bv)
(check-sat-using smt)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
    unsat
---*)
