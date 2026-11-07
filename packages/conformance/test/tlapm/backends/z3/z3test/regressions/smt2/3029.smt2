(*---
description: z3test's regression regressions/smt2/3029.smt2.
ref: regressions/smt2/3029.smt2
features:
  - z3test
outcome: sat
---*)
(declare-sort E 0)
(declare-fun f (E) Bool)
(declare-fun g (E) E)
(assert (forall ((a E)) (f (g a))))
(check-sat-using bv)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
