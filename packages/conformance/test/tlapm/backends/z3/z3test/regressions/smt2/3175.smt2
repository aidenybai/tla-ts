(*---
description: z3test's regression regressions/smt2/3175.smt2.
ref: regressions/smt2/3175.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic BV)
(set-option :model_validate true)
(set-option :model true)
(declare-const v0 Bool)
(declare-const v1 Bool)
(declare-const v2 Bool)
(declare-const v3 Bool)
(declare-const v4 Bool)
(declare-const v5 Bool)
(declare-const v6 Bool)
(declare-const v7 Bool)
(declare-const v8 Bool)
(declare-const bv_27-0 (_ BitVec 27))
(declare-const v9 Bool)
(declare-const v10 Bool)
(assert (= (= (= bv_27-0 (bvsdiv bv_27-0 bv_27-0) bv_27-0 (bvsdiv bv_27-0 bv_27-0)) (bvule bv_27-0 bv_27-0) v6 (distinct bv_27-0 (bvsdiv bv_27-0 bv_27-0) bv_27-0) v10 v0 (not v8) v4 v6) v2 (xor (distinct bv_27-0 (bvsdiv bv_27-0 bv_27-0) bv_27-0) v3 v6 v8 v1 v2 v6 v1 v1 v3) v3))
(assert (exists ((q0 (_ BitVec 29)) (q1 (_ BitVec 11)) (q2 (_ BitVec 27))) (not (= q2 bv_27-0 ((_ rotate_left 0) bv_27-0) bv_27-0))))
(assert (bvugt ((_ rotate_left 0) bv_27-0) (bvsdiv bv_27-0 bv_27-0)))
(assert (bvule bv_27-0 bv_27-0))
(declare-const v11 Bool)
(assert (not (= bv_27-0 (bvsdiv bv_27-0 bv_27-0) bv_27-0 (bvsdiv bv_27-0 bv_27-0))))
(declare-const v12 Bool)
(assert v3)
(declare-const v13 Bool)
(declare-const v14 Bool)
(declare-const v15 Bool)
(assert (= bv_27-0 (bvsdiv bv_27-0 bv_27-0) bv_27-0 (bvsdiv bv_27-0 bv_27-0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
