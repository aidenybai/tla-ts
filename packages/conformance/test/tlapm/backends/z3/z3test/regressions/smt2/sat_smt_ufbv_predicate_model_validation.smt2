(*---
description: z3test's regression regressions/smt2/sat_smt_ufbv_predicate_model_validation.smt2.
ref: regressions/smt2/sat_smt_ufbv_predicate_model_validation.smt2
features:
  - z3test
outcome: sat
---*)
; Regression: sat.smt engine on a QF_UFBV predicate must produce a valid model.
; Transferred from src/test/simplifier.cpp (test_sat_smt_ufbv_predicate_model_validation).
(set-logic QF_UFBV)
(set-option :sat.smt true)
(set-option :model_validate true)
(declare-fun p ((_ BitVec 4)) Bool)
(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(assert (xor (p x) (p y)))
(assert (bvuge x (_ bv1 4)))
(assert (bvult y (_ bv1 4)))
(check-sat)
;(get-model)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
