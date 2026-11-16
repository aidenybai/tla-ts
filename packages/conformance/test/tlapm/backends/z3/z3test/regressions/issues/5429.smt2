(*---
description: z3test's regression regressions/issues/5429.smt2.
ref: regressions/issues/5429.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :sat.euf true)
(set-option :tactic.default_tactic smt)
(set-option :model_validate true)



(declare-fun t () (_ BitVec 5))
(declare-fun s () (_ BitVec 5))
(declare-fun l1 () Bool)
(assert
(let ((?x16 t))
(let ((?x22 t))
(let ((?x6 ((_ extract 4 4) s)))
(let (($x20 l1)) (let (($x25 l1))
(let ((?x32 (ite (or false true)
(ite (= (bvurem (ite (= ?x6 (_ bv1 1)) (bvneg s) s) (ite (= ((_ extract 4 4) t) (_ bv1 1)) (bvneg t) t)) (_ bv0 5)) (_ bv0 5) (bvadd (bvneg (bvurem (ite (= ?x6 (_ bv1 1)) (bvneg s) s) t)) t)) (ite true (ite (= t (_ bv0 5)) (_ bv0 5) (bvadd (bvurem (ite (= ?x6 (_ bv1 1)) (bvneg s) s) t) (_ bv0 5))) (_ bv0 5))))) (let (($x24 l1)) (let ((?x23 t)) (not (= (bvsmod s t) (ite (and (= ?x6 (_ bv0 1)) true) (bvurem (ite (= ?x6 (_ bv1 1)) (bvneg s) s) (ite (= ((_ extract 4 4) t) (_ bv1 1)) (bvneg t) t)) ?x32))))))))))))
(assert (let ((?x111 (bvurem_i (ite l1 t t) t))) (let ((?x113 t)) (let ((?x51 t)) (let ((?x119 (bvsmod_i t t))) (let (($x47 l1)) (= l1 (= (bvsmod_i s t) (ite false (bvurem_i (ite (= ((_ extract 4 4) s) (_ bv1 1)) (bvmul (_ bv31 5) s) s) (ite (= ((_ extract 4 4) t) (_ bv1 1)) (bvmul (_ bv31 5) t) t)) (ite false (ite (= (bvurem_i (ite (= ((_ extract 4 4) s) (_ bv1 1)) (bvmul (_ bv31 5) s) s) (ite (= ((_ extract 4 4) t) (_ bv1 1)) (bvmul (_ bv31 5) t) t)) (_ bv0 5)) (_ bv0 5) (bvadd (bvmul (_ bv31 5) (bvurem_i (ite (= ((_ extract 4 4) s) (_ bv1 1)) (bvmul (_ bv31 5) s) s) (ite (= ((_ extract 4 4) t) (_ bv1 1)) (bvmul (_ bv31 5) t) t))) t)) (_ bv0 5)))))))))))
(check-sat)


(reset)


(declare-const _v (_ BitVec 1))
(declare-fun f () (Array (_ BitVec 4) (_ BitVec 4)))
(assert (forall ((v (_ BitVec 4))) (forall ((u (Array (_ BitVec 4) (_ BitVec 4))))
           (and (distinct (store u v ((_ zero_extend 3) _v)) (store f (_ bv0 4) (_ bv0 4)))))))
(check-sat)
(reset)

(assert (forall ((a Real))
          (exists ((b Int)) (=> (< b 0)
	     (exists ((b Int)) (< b a)) (and (>= b a)
	          (forall ((a Real)) (exists ((b Int)) (= b a))))))))
(check-sat)
(reset)


(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(declare-fun g () Real)
(assert (or (not (=> (and (= g 1) (= g 0) (<= 1 c)) (<= a 0)))
            (and true
	    (and (exists ((f Real)) (forall ((d Real)) (= d 0))))
	    )))
(assert (= b 0))
(check-sat)
(reset)


(declare-fun a () Bool)
(assert (= 1 (+ 0 (ite (not (not (= (+ 0 (ite a 1 0)) 0))) 0 1))))
(check-sat)
(reset)

(declare-datatypes ((msg_cmd$type 0)) (((empty) (reqe) (invack) (gnte))))
(declare-datatypes ((msg$type 0)) (((c_msg$type (m_cmd msg_cmd$type)))))
(declare-datatypes ((BOOL 0)) (((Truth) (Falsity))))
(declare-sort node$type)
(declare-fun chan3$1 () (Array node$type msg$type))
(declare-fun shrset$1 () (Array node$type BOOL))
(declare-fun chan3 () (Array node$type msg$type))
(assert (not (distinct true (forall ((n node$type)) (let (($x19 (= empty (m_cmd (select chan3 n))))))) (and false (and (not (= Truth (ite true (ite (exists ((n node$type)) (= (m_cmd (select chan3$1 n)) empty)) Truth Falsity) (ite (forall ((n node$type)) (and (not (= Truth (select shrset$1 n))) (not (= (m_cmd (select chan3$1 n)) empty)))) Truth Falsity)))))))))
;(check-sat)
(reset)

(set-info :status unsat)
(assert (forall ((a Real)) (exists ((b Real)) (> b (* b a)))))
(check-sat)
(reset)

(set-info :status unknown)
(assert (let (($x17 (not (fp.eq (fp (_ bv0 1) (_ bv1 11) (_ bv0 52)) (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)))))) $x17))
(check-sat)
(reset)

(declare-fun val () (_ BitVec 1))
(declare-fun B () (Array (_ BitVec 1) (_ BitVec 1)))
(declare-fun A () (Array (_ BitVec 1) (_ BitVec 1)))
(declare-fun sel () Bool)
(assert (and sel (not (= A B)) (or (bvugt (_ bv1 1) val) (= A (store B (_ bv1 1) (_ bv0 1))))))
(check-sat)
(reset)

(declare-fun a () Float64)
(assert (= (not (fp.leq a a)) (not (fp.leq a a))))
(check-sat)
(reset)


(declare-fun a () (_ BitVec 64))
(assert (not (fp.geq ((_ to_fp 11 53) a) ((_ to_fp 11 53) (_ bv0 64)))))
(check-sat)
(reset)


(declare-const v (_ BitVec 1))
(declare-const u (_ BitVec 1))
(declare-const i (_ BitVec 1))
(declare-const j (_ BitVec 1))
(declare-fun a () (Array (_ BitVec 32) (_ BitVec 8)))
(assert (not (= i j)))
(assert (not (= u v)))
(assert (= (store (store a ((_ zero_extend 31) i) ((_ zero_extend 7) u)) ((_ zero_extend 31) j) (_ bv0 8))
           (store a ((_ zero_extend 31) i) ((_ zero_extend 7) v))))
(check-sat)
(reset)

(declare-sort S$t$type)
(declare-sort resource$type)
(declare-datatypes ((BOOL 0)) (((Truth))))
(declare-sort process$type)
(declare-fun null () resource$type)
(declare-fun S$mem (process$type S$t$type) BOOL)
(assert (exists ((create$r resource$type)) (exists ((handles (Array resource$type S$t$type))) (exists ((ref (Array process$type resource$type))) (or (= create$r null) (exists ((p process$type) (r resource$type)) (or (= r (ref p)) (= Truth (S$mem p (handles r))))))))))
(check-sat-using ctx-solver-simplify)
(reset)

(assert (forall ((x Int)) (distinct (mod 0 x) x)))
(check-sat)
(reset)

(declare-sort S$t$type)
(declare-sort resource$type)
(declare-datatypes ((BOOL 0)) (((Truth) (Falsity))))
(declare-sort process$type)
(declare-fun S$mem (process$type S$t$type) BOOL)
(declare-fun ref () (Array process$type resource$type))
(declare-fun handles () (Array resource$type S$t$type))
(declare-fun S$cardinality (S$t$type) Int)
(declare-fun S$empty () S$t$type)
(declare-fun l3 () Bool)
(declare-fun l9 () Bool)
(declare-fun True () Bool)
(assert (or (forall ((y process$type)) True) (forall ((x process$type)) (let (($x17 True)))) false (forall ((s S$t$type)) True) (forall ((x process$type) (s S$t$type)) (= (S$cardinality s) (ite (= (S$mem x s) Truth) (S$cardinality s) (S$cardinality s)))) (exists ((p process$type)) (not (= Truth (S$mem p (select handles (select ref p))))))))
(assert (= l9 (forall ((e process$type)) (not (= Truth (S$mem e S$empty))))))
(assert (= l3 (forall ((p process$type)) (= (S$mem p (select handles (select ref p))) Truth))))
(assert (not True))
(check-sat)
(reset)

(exit)


(declare-fun a () (_ BitVec 8))
(declare-fun b () (_ BitVec 8))
(assert
 (forall ((x (_ BitVec 8)))
  (ite
   (distinct (forall ((x (_ BitVec 8))) (not (= (bvlshr x a) b)))
    (xor (forall ((x (_ BitVec 8))) (not (= (bvlshr x a) b)))
     (forall ((x (_ BitVec 8))) (not (= (bvlshr x a) b)))))
   (distinct (not (= (bvlshr x a) b))
    (xor (forall ((x (_ BitVec 8))) (not (= (bvlshr x a) b)))
     (forall ((x (_ BitVec 8)))
      (not (= (bvlshr x a) b))))) (= (bvlshr x a) b))))
(check-sat)
(reset)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    sat
    unsat
    sat
    unsat
    sat
    sat
    sat
    sat
    unsat
    sat
    sat
    sat
---*)
