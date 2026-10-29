;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_+_(_, _),
;;	       NEW CONSTANT CONSTANT_-_(_, _),
;;	       NEW CONSTANT CONSTANT_A_,
;;	       NEW CONSTANT CONSTANT_B_,
;;	       NEW CONSTANT CONSTANT_C_,
;;	       NEW CONSTANT CONSTANT_P_(_),
;;	       NEW CONSTANT CONSTANT_Q_(_, _),
;;	       NEW CONSTANT CONSTANT_R_(_, _, _),
;;	       NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_,
;;	       NEW CONSTANT CONSTANT_U_,
;;	       NEW CONSTANT CONSTANT_x_ \in CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_y_ \in CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_z_ \in CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_j_,
;;	       NEW CONSTANT CONSTANT_k_,
;;	       NEW CONSTANT CONSTANT_l_,
;;	       "ordinary TLA+ operators" ,
;;	       "if/then/else" ,
;;	       "expressions that introduce binders" ,
;;	       CONSTANT_x_ = CONSTANT_x_ ,
;;	       CONSTANT_y_ = CONSTANT_y_ ,
;;	       CONSTANT_z_ = CONSTANT_z_ ,
;;	       CONSTANT_j_ = CONSTANT_j_ ,
;;	       CONSTANT_k_ = CONSTANT_k_ ,
;;	       CONSTANT_l_ = CONSTANT_l_ ,
;;	       0 = 0 ,
;;	       CONSTANT_x_ = CONSTANT_x_ ,
;;	       CONSTANT_y_ = CONSTANT_y_ ,
;;	       CONSTANT_z_ = CONSTANT_z_ ,
;;	       CONSTANT_j_ = CONSTANT_j_ ,
;;	       CONSTANT_k_ = CONSTANT_k_ ,
;;	       CONSTANT_l_ = CONSTANT_l_ ,
;;	       1 = 1 
;;	PROVE  CONSTANT_x_ = CONSTANT_x_ /\ CONSTANT_y_ = CONSTANT_y_
;;	       /\ CONSTANT_z_ = CONSTANT_z_ /\ CONSTANT_j_ = CONSTANT_j_
;;	       /\ CONSTANT_k_ = CONSTANT_k_ /\ CONSTANT_l_ = CONSTANT_l_ /\ 2 = 2
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #22
;; Generated from file "./Subref_test.tla", line 65, characters 7-13

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__expressionsspace__thatspace__introducespace__binders () Idv)

(declare-fun smt__TLA____StrLit__ifslash__thenslash__else () Idv)

(declare-fun smt__TLA____StrLit__ordinaryspace__TLAplussign__space__operators () Idv)

(declare-fun smt__TLA____StrSet () Idv)

(declare-fun smt__TLA____Tt__Idv () Idv)

;; Axiom: SetExt
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (!
        (=>
          (forall ((smt__z Idv))
            (= (smt__TLA____Mem smt__z smt__x)
              (smt__TLA____Mem smt__z smt__y))) (= smt__x smt__y))
        :pattern ((smt__TLA____SetExtTrigger smt__x smt__y))))
    :named |SetExt|))

;; Axiom: StrLitIsstr expressions that introduce binders
(assert
  (!
    (smt__TLA____Mem
      smt__TLA____StrLit__expressionsspace__thatspace__introducespace__binders
      smt__TLA____StrSet)
    :named |StrLitIsstr expressions that introduce binders|))

;; Axiom: StrLitIsstr if/then/else
(assert
  (!
    (smt__TLA____Mem smt__TLA____StrLit__ifslash__thenslash__else
      smt__TLA____StrSet) :named |StrLitIsstr if/then/else|))

;; Axiom: StrLitIsstr ordinary TLA+ operators
(assert
  (!
    (smt__TLA____Mem
      smt__TLA____StrLit__ordinaryspace__TLAplussign__space__operators
      smt__TLA____StrSet) :named |StrLitIsstr ordinary TLA+ operators|))

;; Axiom: StrLitDistinct expressions that introduce binders if/then/else
(assert
  (!
    (distinct
      smt__TLA____StrLit__expressionsspace__thatspace__introducespace__binders
      smt__TLA____StrLit__ifslash__thenslash__else)
    :named |StrLitDistinct expressions that introduce binders if/then/else|))

;; Axiom: StrLitDistinct expressions that introduce binders ordinary TLA+ operators
(assert
  (!
    (distinct
      smt__TLA____StrLit__expressionsspace__thatspace__introducespace__binders
      smt__TLA____StrLit__ordinaryspace__TLAplussign__space__operators)
    :named |StrLitDistinct expressions that introduce binders ordinary TLA+ operators|))

;; Axiom: StrLitDistinct if/then/else ordinary TLA+ operators
(assert
  (!
    (distinct smt__TLA____StrLit__ifslash__thenslash__else
      smt__TLA____StrLit__ordinaryspace__TLAplussign__space__operators)
    :named |StrLitDistinct if/then/else ordinary TLA+ operators|))

;; Axiom: CastInjAlt Int
(assert
  (!
    (forall ((smt__x Int))
      (! (= smt__x (smt__TLA____Proj__Int (smt__TLA____Cast__Int smt__x)))
        :pattern ((smt__TLA____Cast__Int smt__x)))) :named |CastInjAlt Int|))

;; Axiom: TypeGuardIntro Int
(assert
  (!
    (forall ((smt__z Int))
      (! (smt__TLA____Mem (smt__TLA____Cast__Int smt__z) smt__TLA____IntSet)
        :pattern ((smt__TLA____Cast__Int smt__z))))
    :named |TypeGuardIntro Int|))

;; Axiom: TypeGuardElim Int
(assert
  (!
    (forall ((smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x smt__TLA____IntSet)
          (= smt__x (smt__TLA____Cast__Int (smt__TLA____Proj__Int smt__x))))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____IntSet))))
    :named |TypeGuardElim Int|))

(declare-fun smt__CONSTANT__plussign____ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__hyphen____ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__A__ () Idv)

(declare-fun smt__CONSTANT__B__ () Idv)

(declare-fun smt__CONSTANT__C__ () Idv)

(declare-fun smt__CONSTANT__P__ (Idv) Idv)

(declare-fun smt__CONSTANT__Q__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__R__ (Idv Idv Idv) Idv)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

(declare-fun smt__CONSTANT__U__ () Idv)

(declare-fun smt__CONSTANT__x__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__S__))

(declare-fun smt__CONSTANT__y__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__y__ smt__CONSTANT__S__))

(declare-fun smt__CONSTANT__z__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__z__ smt__CONSTANT__S__))

(declare-fun smt__CONSTANT__j__ () Idv)

(declare-fun smt__CONSTANT__k__ () Idv)

(declare-fun smt__CONSTANT__l__ () Idv)

; hidden fact

; hidden fact

(assert
  (= smt__TLA____StrLit__ordinaryspace__TLAplussign__space__operators
    smt__TLA____Tt__Idv))

(assert (= smt__TLA____StrLit__ifslash__thenslash__else smt__TLA____Tt__Idv))

(assert
  (= smt__TLA____StrLit__expressionsspace__thatspace__introducespace__binders
    smt__TLA____Tt__Idv))

; hidden fact

; hidden fact

(assert (= smt__CONSTANT__x__ smt__CONSTANT__x__))

(assert (= smt__CONSTANT__y__ smt__CONSTANT__y__))

(assert (= smt__CONSTANT__z__ smt__CONSTANT__z__))

(assert (= smt__CONSTANT__j__ smt__CONSTANT__j__))

(assert (= smt__CONSTANT__k__ smt__CONSTANT__k__))

(assert (= smt__CONSTANT__l__ smt__CONSTANT__l__))

(assert (= (smt__TLA____Cast__Int 0) (smt__TLA____Cast__Int 0)))

(assert (= smt__CONSTANT__x__ smt__CONSTANT__x__))

(assert (= smt__CONSTANT__y__ smt__CONSTANT__y__))

(assert (= smt__CONSTANT__z__ smt__CONSTANT__z__))

(assert (= smt__CONSTANT__j__ smt__CONSTANT__j__))

(assert (= smt__CONSTANT__k__ smt__CONSTANT__k__))

(assert (= smt__CONSTANT__l__ smt__CONSTANT__l__))

(assert (= (smt__TLA____Cast__Int 1) (smt__TLA____Cast__Int 1)))

; hidden fact

; hidden fact

;; Goal
(assert
  (!
    (not
      (and
        (and
          (and
            (and
              (and
                (and (= smt__CONSTANT__x__ smt__CONSTANT__x__)
                  (= smt__CONSTANT__y__ smt__CONSTANT__y__))
                (= smt__CONSTANT__z__ smt__CONSTANT__z__))
              (= smt__CONSTANT__j__ smt__CONSTANT__j__))
            (= smt__CONSTANT__k__ smt__CONSTANT__k__))
          (= smt__CONSTANT__l__ smt__CONSTANT__l__))
        (= (smt__TLA____Cast__Int 2) (smt__TLA____Cast__Int 2))))
    :named |Goal|))

(check-sat)
(exit)
