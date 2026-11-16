(*---
description: z3test's regression regressions/smt2/6983-3.smt2.
ref: regressions/smt2/6983-3.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(declare-fun a () (Array (_ BitVec 32) (_ BitVec 8)))
(assert (bvsgt (_ bv0 64) (bvsmod (concat (select a (_ bv0 32)) (select a (_ bv1 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32))) ((_ sign_extend 32) (ite (fp.lt (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)) ((_ to_fp 11 53) (bvnand (_ bv1 64) (concat (select a (_ bv0 32)) (select a (_ bv1 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)))))) (_ bv1 32) (_ bv0 32))))))
(check-sat)

(reset)

(define-fun a () (Array (_ BitVec 32) (_ BitVec 8)) (store (store ((as const (Array (_ BitVec 32) (_ BitVec 8))) #b00000000) #b00000000000000000000000000000000 #b11111111) #b00000000000000000000000000000001 #b11111111))
(assert (bvsgt (_ bv0 64) (bvsmod (concat (select a (_ bv0 32)) (select a (_ bv1 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32))) ((_ sign_extend 32) (ite (fp.lt (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)) ((_ to_fp 11 53) (bvnand (_ bv1 64) (concat (select a (_ bv0 32)) (select a (_ bv1 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)) (select a (_ bv0 32)))))) (_ bv1 32) (_ bv0 32))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
