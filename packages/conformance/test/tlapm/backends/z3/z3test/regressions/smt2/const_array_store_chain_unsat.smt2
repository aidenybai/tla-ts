(*---
description: z3test's regression regressions/smt2/const_array_store_chain_unsat.smt2.
ref: regressions/smt2/const_array_store_chain_unsat.smt2
features:
  - z3test
outcome: unsat
---*)
; Regression: const-array store chain over QF_ABV. With distinct x y, equating
; the single stores of two different constant arrays is unsatisfiable.
; Transferred from src/test/mod_factor.cpp (test_const_array_store_chain_unsat).
(set-logic QF_ABV)
(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(define-fun A0 () (Array (_ BitVec 2) (_ BitVec 8)) ((as const (Array (_ BitVec 2) (_ BitVec 8))) x))
(define-fun A1 () (Array (_ BitVec 2) (_ BitVec 8)) ((as const (Array (_ BitVec 2) (_ BitVec 8))) y))
(declare-const i0 (_ BitVec 2))
(declare-const e0 (_ BitVec 8))
(declare-const i1 (_ BitVec 2))
(declare-const e1 (_ BitVec 8))
(assert (distinct x y))
(assert (= (store A0 i0 e0) (store A1 i1 e1)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
