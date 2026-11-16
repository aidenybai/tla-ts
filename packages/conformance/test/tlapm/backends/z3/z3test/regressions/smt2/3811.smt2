(*---
description: z3test's regression regressions/smt2/3811.smt2.
ref: regressions/smt2/3811.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :fp.xform.bit_blast true)
(assert (forall ((a Int)) (= a 0)))
;(check-sat)
(check-sat-using horn)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
