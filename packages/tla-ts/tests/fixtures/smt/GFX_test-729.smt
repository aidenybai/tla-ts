;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Proc_,
;;	       NEW VARIABLE VARIABLE_A1_,
;;	       NEW VARIABLE VARIABLE_result_,
;;	       NEW VARIABLE VARIABLE_pc_,
;;	       NEW VARIABLE VARIABLE_known_,
;;	       NEW VARIABLE VARIABLE_notKnown_,
;;	       STATE_TypeOK_ /\ STATE_InvB_ /\ STATE_InvC_ /\ STATE_GFXCorrect_ ,
;;	       ACTION_Next_ ,
;;	       NEW CONSTANT CONSTANT_p_ \in CONSTANT_Proc_,
;;	       ACTION_b_(CONSTANT_p_) ,
;;	       NEW CONSTANT CONSTANT_q_ \in CONSTANT_Proc_,
;;	       CONSTANT_Cardinality_(?VARIABLE_result_#prime[CONSTANT_q_]) > 0 ,
;;	       NEW CONSTANT CONSTANT_P_ \in {?h6db5c(CONSTANT_wa_) :
;;	                                       CONSTANT_wa_ \in ?h68829}
;;	PROVE  \E CONSTANT_wa_ \in ?h68829 : CONSTANT_P_ = ?h6db5c(CONSTANT_wa_)
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #729
;; Generated from file "./GFX_test.tla", line 886, characters 13-14

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__h68829 () Idv)

(declare-fun smt__TLA____Anon__h6db5c (Idv) Idv)

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____IsSetOf (Idv) Bool)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

; omitted declaration of 'TLA__SetOf_1' (second-order)

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

;; Axiom: FunExt
(assert
  (!
    (forall ((smt__f Idv) (smt__g Idv))
      (!
        (=>
          (and (smt__TLA____FunIsafcn smt__f) (smt__TLA____FunIsafcn smt__g)
            (= (smt__TLA____FunDom smt__f) (smt__TLA____FunDom smt__g))
            (forall ((smt__x Idv))
              (=> (smt__TLA____Mem smt__x (smt__TLA____FunDom smt__f))
                (= (smt__TLA____FunApp smt__f smt__x)
                  (smt__TLA____FunApp smt__g smt__x))))) (= smt__f smt__g))
        :pattern ((smt__TLA____FunIsafcn smt__f)
                   (smt__TLA____FunIsafcn smt__g)))) :named |FunExt|))

; omitted fact (second-order)

; omitted fact (second-order)

; omitted fact (second-order)

;; Axiom: CompareSetOfTrigger
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv))
      (! (smt__TLA____SetExtTrigger smt__a smt__b)
        :pattern ((smt__TLA____IsSetOf smt__a) (smt__TLA____IsSetOf smt__b))))
    :named |CompareSetOfTrigger|))

; omitted fact (second-order)

; omitted fact (second-order)

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

;; Axiom: Typing TIntLteq
(assert
  (!
    (forall ((smt__x1 Int) (smt__x2 Int))
      (!
        (=
          (smt__TLA____IntLteq (smt__TLA____Cast__Int smt__x1)
            (smt__TLA____Cast__Int smt__x2)) (<= smt__x1 smt__x2))
        :pattern ((smt__TLA____IntLteq (smt__TLA____Cast__Int smt__x1)
                    (smt__TLA____Cast__Int smt__x2)))))
    :named |Typing TIntLteq|))

; omitted fact (second-order)

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__Proc__ () Idv)

; hidden fact

(declare-fun smt__VARIABLE__A1__ () Idv)

(declare-fun smt__VARIABLE__A1____prime () Idv)

(declare-fun smt__VARIABLE__result__ () Idv)

(declare-fun smt__VARIABLE__result____prime () Idv)

(declare-fun smt__VARIABLE__pc__ () Idv)

(declare-fun smt__VARIABLE__pc____prime () Idv)

(declare-fun smt__VARIABLE__known__ () Idv)

(declare-fun smt__VARIABLE__known____prime () Idv)

(declare-fun smt__VARIABLE__notKnown__ () Idv)

(declare-fun smt__VARIABLE__notKnown____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__a__ (Idv) Idv)

(declare-fun smt__ACTION__b__ (Idv) Idv)

(declare-fun smt__ACTION__Pr__ (Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__Termination__ () Idv)

(declare-fun smt__STATE__snapshot__ () Idv)

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__Done__ (Idv) Idv)

(declare-fun smt__STATE__GFXCorrect__ () Idv)

(declare-fun smt__CONSTANT__NotAProc__ () Idv)

(declare-fun smt__STATE__ReadyToWrite__ (Idv Idv) Idv)

(declare-fun smt__STATE__WriterAssignment__ () Idv)

(declare-fun smt__STATE__PV__ (Idv) Idv)

(declare-fun smt__STATE__InvB__ () Idv)

(declare-fun smt__STATE__InvC__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Test__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (and
    (and
      (and (= smt__STATE__TypeOK__ smt__TLA____Tt__Idv)
        (= smt__STATE__InvB__ smt__TLA____Tt__Idv))
      (= smt__STATE__InvC__ smt__TLA____Tt__Idv))
    (= smt__STATE__GFXCorrect__ smt__TLA____Tt__Idv)))

(assert (= smt__ACTION__Next__ smt__TLA____Tt__Idv))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__p__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__p__ smt__CONSTANT__Proc__))

; hidden fact

; hidden fact

; hidden fact

(assert (= (smt__ACTION__b__ smt__CONSTANT__p__) smt__TLA____Tt__Idv))

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__q__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__q__ smt__CONSTANT__Proc__))

(assert
  (and
    (smt__TLA____IntLteq (smt__TLA____Cast__Int 0)
      (smt__CONSTANT__Cardinality__
        (smt__TLA____FunApp smt__VARIABLE__result____prime smt__CONSTANT__q__)))
    (distinct (smt__TLA____Cast__Int 0)
      (smt__CONSTANT__Cardinality__
        (smt__TLA____FunApp smt__VARIABLE__result____prime smt__CONSTANT__q__)))))

(declare-fun smt__CONSTANT__P__ () Idv)

(declare-fun smt__TLA____SetOf__1__flatnd__1 (Idv) Idv)

;; Axiom: SetOfIntro 1 TLA__SetOf_1_flatnd_1
(assert
  (!
    (forall ((smt__a1 Idv) (smt__y1 Idv))
      (!
        (=> (smt__TLA____Mem smt__y1 smt__a1)
          (smt__TLA____Mem (smt__TLA____Anon__h6db5c smt__y1)
            (smt__TLA____SetOf__1__flatnd__1 smt__a1)))
        :pattern ((smt__TLA____Anon__h6db5c smt__y1)
                   (smt__TLA____SetOf__1__flatnd__1 smt__a1))
        :pattern ((smt__TLA____SetOf__1__flatnd__1 smt__a1)
                   (smt__TLA____Mem smt__y1 smt__a1))))
    :named |SetOfIntro 1 TLA__SetOf_1_flatnd_1|))

;; Axiom: SetOfElim 1 TLA__SetOf_1_flatnd_1
(assert
  (!
    (forall ((smt__a1 Idv) (smt__x Idv))
      (!
        (=>
          (smt__TLA____Mem smt__x (smt__TLA____SetOf__1__flatnd__1 smt__a1))
          (exists ((smt__y1 Idv))
            (and (smt__TLA____Mem smt__y1 smt__a1)
              (= smt__x (smt__TLA____Anon__h6db5c smt__y1)))))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetOf__1__flatnd__1 smt__a1)))))
    :named |SetOfElim 1 TLA__SetOf_1_flatnd_1|))

;; Axiom: AssertIsSetOf 1 TLA__SetOf_1_flatnd_1
(assert
  (!
    (forall ((smt__a Idv))
      (! (smt__TLA____IsSetOf (smt__TLA____SetOf__1__flatnd__1 smt__a))
        :pattern ((smt__TLA____SetOf__1__flatnd__1 smt__a))))
    :named |AssertIsSetOf 1 TLA__SetOf_1_flatnd_1|))

(assert
  (smt__TLA____Mem smt__CONSTANT__P__
    (smt__TLA____SetOf__1__flatnd__1 smt__TLA____Anon__OPAQUE__h68829)))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

;; Goal
(assert
  (!
    (not
      (exists ((smt__CONSTANT__wa__ Idv))
        (and
          (smt__TLA____Mem smt__CONSTANT__wa__
            smt__TLA____Anon__OPAQUE__h68829)
          (= smt__CONSTANT__P__
            (smt__TLA____Anon__h6db5c smt__CONSTANT__wa__))))) :named |Goal|))

(check-sat)
(exit)
