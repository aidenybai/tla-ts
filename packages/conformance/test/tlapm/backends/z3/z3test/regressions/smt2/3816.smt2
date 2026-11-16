(*---
description: z3test's regression regressions/smt2/3816.smt2.
ref: regressions/smt2/3816.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (forall ((a Bool) (b Bool) (d (_ BitVec 1)) (e (_ BitVec 1)) (f (_ BitVec 1)) (g Bool))
     (= (= f (ite a (_ bv0 1) (ite (not (= d (_ bv0 1))) (_ bv0 1) (ite b e e)))) g)))
(check-sat-using horn)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
