(*---
description: z3test's regression regressions/issues/5420.smt2.
ref: regressions/issues/5420.smt2
features:
  - z3test
outcome: unknown
---*)
(set-option :sat.euf true)
(set-option :tactic.default_tactic smt)
(set-option :model_validate true)
(assert (forall ((i10 Int)) (= 0 (mod 0 i10))))
(check-sat)
(reset)


(declare-const x5 Bool)
(assert (forall ((x (_ BitVec 6))) (and x5 (distinct (_ bv0 1) ((_ extract 0 0) x)))))
(check-sat)
(push)
(check-sat)
(reset)

(declare-const x Bool)
(assert (not (exists ((t Real)) (or x (not x)))))
(check-sat)
(reset)

(declare-fun t () (_ BitVec 2))
(declare-fun s () (_ BitVec 2))
(declare-fun l1 () Bool)
(assert (not (= (_ bv1 2) (ite (= (_ bv0 2) (bvurem (ite false t s) t)) (_ bv0 2) (ite false (_ bv1 2) (_ bv1 2))))))
(assert (= l1 (= (bvsmod_i (_ bv1 2) t) (ite false t (ite (= (_ bv0 2) (bvurem_i s t)) (_ bv0 2) (bvadd s (_ bv1 2)))))))
(check-sat)
(reset)

(declare-fun my_uf_fb (Float32) Bool)
(assert (= false (my_uf_fb (_ +oo 8 24))))
(assert (= true (my_uf_fb (_ -oo 8 24))))
(check-sat)
(reset)

(set-option :rewriter.bit2bool false)
(assert (forall ((_substvar_81_ (_ BitVec 3))) (= (not (bvugt (ite (bvsle _substvar_81_ (_ bv0 3)) (_ bv1 1) (_ bv0 1)) (_ bv0 1))) (bvslt (_ bv0 14) ((_ zero_extend 13) (ite (bvsle _substvar_81_ (_ bv0 3)) (_ bv1 1) (_ bv0 1)))))))
(check-sat-using (then simplify nnf lira))
(reset)


(assert (= 1.0 (div 0 0.0)))
(check-sat)
(check-sat-using smt)
(reset)

(declare-fun x1 () (_ BitVec 1))
(declare-fun o2 () Bool)
(assert (forall ((o13 Bool)) (exists ((x3 (_ BitVec 1))) (forall ((x4 (_ BitVec 1))) (and o2 (not (bvult x3 x1)) (= o13 (bvult x4 x1)))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unknown
    unsat
    unsat
    unsat
    sat
    sat
    unsat
    sat
    sat
    unsat
---*)
