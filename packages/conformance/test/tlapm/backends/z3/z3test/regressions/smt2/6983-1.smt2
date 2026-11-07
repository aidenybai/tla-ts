(*---
description: z3test's regression regressions/smt2/6983-1.smt2.
ref: regressions/smt2/6983-1.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(declare-fun s () (Array (_ BitVec 32) (_ BitVec 8)))
(assert (fp.leq ((_ to_fp 8 24) (concat (select s (_ bv0 32)) (select s (_ bv1 32)) (select s (_ bv0 32)) (select s (_ bv0 32)))) (fp (_ bv0 1) (_ bv0 8) (_ bv0 23))))
(assert (not (fp.geq ((_ to_fp 8 24) (bvxnor (_ bv0 32) (concat (select s (_ bv0 32)) (select s (_ bv1 32)) (select s (_ bv0 32)) (select s (_ bv0 32))))) (fp (_ bv0 1) (_ bv0 8) (_ bv0 23)))))
(check-sat)

(reset)

(define-fun s () (Array (_ BitVec 32) (_ BitVec 8)) (store (store ((as const (Array (_ BitVec 32) (_ BitVec 8))) #b00000000) #b00000000000000000000000000000000 #b10000000) #b00000000000000000000000000000001 #b01111111))
(assert (fp.leq ((_ to_fp 8 24) (concat (select s (_ bv0 32)) (select s (_ bv1 32)) (select s (_ bv0 32)) (select s (_ bv0 32)))) (fp (_ bv0 1) (_ bv0 8) (_ bv0 23))))
(assert (not (fp.geq ((_ to_fp 8 24) (bvxnor (_ bv0 32) (concat (select s (_ bv0 32)) (select s (_ bv1 32)) (select s (_ bv0 32)) (select s (_ bv0 32))))) (fp (_ bv0 1) (_ bv0 8) (_ bv0 23)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
