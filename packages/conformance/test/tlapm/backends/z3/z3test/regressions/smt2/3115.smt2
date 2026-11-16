(*---
description: z3test's regression regressions/smt2/3115.smt2.
ref: regressions/smt2/3115.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () (_ BitVec 1))
(declare-fun b ((_ BitVec 1)) (_ BitVec 1))
(declare-fun c () (_ BitVec 1))
(assert (= (b (_ bv1 1)) c))
(assert (distinct (b a) c))
(check-sat-using qfufbv_ackr)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
