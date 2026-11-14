(*---
description: z3test's regression regressions/smt2/3985.smt2.
ref: regressions/smt2/3985.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic UFBV)
(assert (! (= #x87 #x87) :named IP_2))
(reset-assertions)
(check-sat)
(assert (! (forall ((q5 (_ BitVec 10)) (q6 (_ BitVec 12))) (bvsge #x1f5 (_ bv0 12))) :named IP_7))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
