(*---
description: z3test's regression regressions/issues/5482.smt2.
ref: regressions/issues/5482.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :sat.euf true)
(set-option :tactic.default_tactic smt)
(set-option :model_validate true)


(declare-datatypes ((msg_cmd$type 0)) (((empty) (reqs) (inv) (invack) (gnts) (gnte))))
(declare-sort data$type)
(declare-datatypes ((msg$type 0)) (((c_msg$type (m_cmd msg_cmd$type) (m_data data$type)))))
(declare-datatypes ((BOOL 0)) (((Truth) (Falsity))))
(declare-sort node$type)
(declare-fun chan2$1 () (Array node$type msg$type))
(declare-fun invset () (Array node$type BOOL))
(declare-fun invset$1 () (Array node$type BOOL))
(declare-fun exgntd () BOOL)
(assert (forall ((curcmd msg_cmd$type)) (exists ((send_inv$i node$type)) (exists ((shrset (Array node$type BOOL))) (exists ((chan2 (Array node$type msg$type))) (not (=> (and (= Truth (select invset send_inv$i)) (= empty (m_cmd (chan2 send_inv$i)))) (not (= (and (= curcmd reqs) (= exgntd Truth)) (=> (and (= invset$1 (store invset send_inv$i Falsity)) (= chan2$1 (store chan2 send_inv$i (c_msg$type inv (m_data (chan2 send_inv$i)))))) (forall ((n node$type)) (or (not (= Truth (shrset n))) (= inv (m_cmd (select chan2$1 n)))))))))))))))
(check-sat)
(reset)


(set-info :status unsat)
(set-logic QF_AX)
(declare-sort Index 0)
(declare-sort Element 0)
(declare-fun a1 () (Array Index Element))
(declare-fun i0 () Index)
(declare-fun i2 () Index)
(declare-fun i3 () Index)
(declare-fun i4 () Index)
(declare-fun i5 () Index)
(declare-fun i6 () Index)
(declare-fun i7 () Index)
(assert (let ((?v_0 (select a1 i3))) (let ((?v_1 (store (store a1 i3 ?v_0) i3 ?v_0))) (let ((?v_2 (store (store ?v_1 i5 (select ?v_1 i7)) i7 (select ?v_1 i5)))) (let ((?v_8 (select ?v_2 i6)) (?v_9 (select ?v_2 i7))) (let ((?v_3 (store (store ?v_2 i6 ?v_9) i7 ?v_8))) (let ((?v_4 (store (store ?v_3 i5 (select ?v_3 i7)) i7 (select ?v_3 i5)))) (let ((?v_5 (store (store ?v_4 i0 (select ?v_4 i7)) i7 (select ?v_4 i0)))) (let ((?v_6 (store (store ?v_5 i4 (select ?v_5 i2)) i2 (select ?v_5 i4)))) (let ((?v_7 (store (store ?v_6 i5 (select ?v_6 i2)) i2 (select ?v_6 i5))) (?v_10 (store (store ?v_2 i7 ?v_8) i6 ?v_9))) (let ((?v_11 (store (store ?v_10 i7 (select ?v_10 i5)) i5 (select ?v_10 i7)))) (let ((?v_12 (store (store ?v_11 i7 (select ?v_11 i0)) i0 (select ?v_11 i7)))) (let ((?v_13 (store (store ?v_12 i2 (select ?v_12 i4)) i4 (select ?v_12 i2)))) (let ((?v_14 (store (store ?v_13 i2 (select ?v_13 i5)) i5 (select ?v_13 i2)))) (not (= (store (store ?v_7 i7 (select ?v_7 i0)) i0 (select ?v_7 i7)) (store (store ?v_14 i7 (select ?v_14 i0)) i0 (select ?v_14 i7))))))))))))))))))
(check-sat)
(reset)

;(exit)

(declare-fun t () (_ BitVec 4))
(assert (forall ((s (_ BitVec 4))) (not (= (bvshl s t) (ite (= (_ bv0 1) ((_ extract 0 0) s)) (_ bv0 4) (bvnot s))))))
(check-sat)
(reset)

(declare-datatypes ((msg_cmd$type 0)) (((empty) (reqe) (gnte))))
(declare-sort data$type)
(declare-datatypes ((msg$type 0)) (((c_msg$type (m_cmd msg_cmd$type) (m_data data$type)))))
(declare-datatypes ((cache_state$type 0)) (((invalid) (exclusive))))
(declare-datatypes ((cache$type 0)) (((c_cache$type (c_state cache_state$type)))))
(declare-datatypes ((BOOL 0)) (((Truth))))
(declare-sort node$type)
(declare-fun chan1$1 () (Array node$type msg$type))
(assert (exists ((send_req_exclusive$i node$type)) (forall ((cache (Array node$type cache$type))) (exists ((exgntd BOOL)) (forall ((chan2 (Array node$type msg$type))) (not (or (= exclusive (c_state (cache send_req_exclusive$i))) (not (= chan1$1 (store chan1$1 send_req_exclusive$i (c_msg$type reqe (m_data (select chan1$1 send_req_exclusive$i)))))) (forall ((n node$type)) (or (= exgntd Truth) (= gnte (m_cmd (chan2 n))))) (not (forall ((n node$type)) (let (($x56 (= gnte (m_cmd (chan2 n)))))))))))))))
(check-sat)
(reset)

(declare-datatypes ((Lst!2131 0) (Nat!2136 0)) (((nil!2135) (cons!2132 (head!2133 Nat!2136))) ((succ!2137) (zero!2139))))
(declare-fun error_value!2140 () Lst!2131)
(declare-fun take!260 (Nat!2136 Lst!2131) Lst!2131)
(assert (forall ((n!258 Nat!2136) (l!259 Lst!2131)) (= l!259 (ite (and ((_ is cons!2132) l!259) (and ((_ is succ!2137) n!258) ((_ is succ!2137) n!258))) (take!260 n!258 l!259) error_value!2140))))
(assert (exists ((xs!416 Lst!2131)) (= nil!2135 (take!260 zero!2139 xs!416))))
(check-sat)
(reset)

(declare-sort S)
(declare-datatypes ((l 1)) ((par (k) ((i) (o (d (l k)))))))
(declare-fun l () (l S))
(assert (forall ((l2 (l S))) (= l l2)))
(check-sat)
(reset)

(declare-fun A () (Array (_ FloatingPoint 2 2) (_ FloatingPoint 2 2)))
(declare-fun A2 () (Array (_ FloatingPoint 2 2) (_ FloatingPoint 2 2)))
(assert (forall ((AP (_ FloatingPoint 2 2))) (forall ((D (Array Int (Array Int (_ FloatingPoint 2 2))))) (and (not (= A A2)) (= (select (D 0) 1) (_ +oo 2 2)) (= (select A (_ +oo 2 2)) (select A (_ -oo 2 2)))))))
(check-sat)
(reset)

(declare-fun z3name!1 ((_ BitVec 1) (_ BitVec 1) Bool Bool) (_ BitVec 1))
(declare-fun z3name!2 ((_ BitVec 1) (_ BitVec 1) Bool) (_ BitVec 1))
(declare-fun l5 () Bool)
(assert (forall ((g Bool) (d (_ BitVec 1)) (e (_ BitVec 1)) (f (_ BitVec 1))) (not (= f (ite (not (= d (_ bv0 1))) (_ bv0 1) e)))))
(assert (= l5 (forall ((k!40 Bool) (k!30 Bool) (k!20 (_ BitVec 1)) (k!10 (_ BitVec 1))) (= (_ bv0 1) (z3name!1 k!10 k!20 k!30 k!40)))))
(assert (= false (forall ((k!20 Bool) (k!10 (_ BitVec 1)) (k!00 (_ BitVec 1))) (= (_ bv0 1) (z3name!2 k!00 k!10 k!20)))))
(check-sat)
(reset)

(define-fun a () (_ BitVec 13) (_ bv0 13))
(define-fun b () (_ BitVec 13) (_ bv1 13))
(assert (not (= a (bvsmod a b))))
(check-sat)
(reset)

(set-logic ALIA)
(declare-fun V_21 () Int)
(declare-fun V_18 () Int)
(declare-fun V_13 () Int)
(declare-fun arr () (Array Int Int))
(declare-fun u () Int)
(declare-fun l () Int)
(declare-fun t_3 () (Array Int Int))
(declare-fun t_2 () (Array Int Int))
(declare-fun t_1 () Int)
(assert (and (and (and (forall ((?V_26 Int)) (=> (and (<= (+ t_1 1) ?V_26) (<= ?V_26 u)) (forall ((?V_27 Int)) (=> (and (<= (+ t_1 1) ?V_27) (<= ?V_27 ?V_26)) (<= (select t_3 ?V_27) (select t_3 ?V_26)))))) (and (= V_13 V_21) (and (forall ((?V_25 Int)) (=> (and (<= 0 ?V_25) (<= ?V_25 (- (+ t_1 1) 1))) (= (select t_3 ?V_25) (select t_2 ?V_25)))) (forall ((?V_24 Int)) (=> (and (<= (+ u 1) ?V_24) (<= ?V_24 (- V_21 1))) (= (select t_3 ?V_24) (select t_2 ?V_24))))))) (and (and (forall ((?V_22 Int)) (=> (and (<= l ?V_22) (<= ?V_22 t_1)) (forall ((?V_23 Int)) (=> (and (<= l ?V_23) (<= ?V_23 ?V_22)) (<= (select t_2 ?V_23) (select t_2 ?V_22)))))) (and (= V_21 V_18) (and (forall ((?V_20 Int)) (=> (and (<= 0 ?V_20) (<= ?V_20 (- l 1))) (= (select t_2 ?V_20) (select arr ?V_20)))) (forall ((?V_19 Int)) (=> (and (<= (+ t_1 1) ?V_19) (<= ?V_19 (- V_18 1))) (= (select t_2 ?V_19) (select arr ?V_19))))))) (and (and (<= l t_1) (< t_1 u)) (and (< l u) (and (and (<= 0 l) (< u V_18)) (>= V_18 0)))))) (or (or (> 0 l) (or (> l t_1) (or (>= t_1 u) (or (>= u V_13) (or (exists ((?V_16 Int)) (and (and (<= l ?V_16) (<= ?V_16 t_1)) (exists ((?V_17 Int)) (and (and (<= l ?V_17) (<= ?V_17 ?V_16)) (> (select t_3 ?V_17) (select t_3 ?V_16)))))) (exists ((?V_14 Int)) (and (and (<= (+ t_1 1) ?V_14) (<= ?V_14 u)) (exists ((?V_15 Int)) (and (and (<= (+ t_1 1) ?V_15) (<= ?V_15 ?V_14)) (> (select t_3 ?V_15) (select t_3 ?V_14))))))))))) (< V_13 0))))
;(check-sat)
(reset)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    unsat
    unsat
    unsat
    unsat
    unsat
    unsat
    unsat
    unsat
---*)
