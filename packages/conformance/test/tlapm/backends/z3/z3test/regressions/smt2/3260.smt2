(*---
description: z3test's regression regressions/smt2/3260.smt2.
ref: regressions/smt2/3260.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic NIA)
(declare-fun _substvar_18_ () Int)
(set-option :smt.arith.solver 4)
(assert (forall ((q0 Bool) (q1 Int) (q2 Int) (q3 Bool)) (not (distinct q1 82))))
(push 1)
(assert (<= _substvar_18_ 286))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
