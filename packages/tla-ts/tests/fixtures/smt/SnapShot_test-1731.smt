;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Proc_,
;;	       NEW CONSTANT CONSTANT_Val_,
;;	       NEW VARIABLE VARIABLE_result_,
;;	       NEW VARIABLE VARIABLE_A2_,
;;	       NEW VARIABLE VARIABLE_A3_,
;;	       NEW VARIABLE VARIABLE_pc_,
;;	       NEW VARIABLE VARIABLE_myVals_,
;;	       NEW VARIABLE VARIABLE_known_,
;;	       NEW VARIABLE VARIABLE_notKnown_,
;;	       NEW VARIABLE VARIABLE_lnbpart_,
;;	       NEW VARIABLE VARIABLE_nbpart_,
;;	       NEW VARIABLE VARIABLE_nextout_,
;;	       NEW VARIABLE VARIABLE_out_,
;;	       STATE_TypeOK_ /\ STATE_Inv1_ /\ STATE_Inv2_ ,
;;	       ACTION_Next_ \/ ?h6fbaa = STATE_vars_ ,
;;	       STATE_TypeOK_ /\ STATE_Inv1_ /\ STATE_Inv2_ ,
;;	       NEW CONSTANT CONSTANT_p_ \in CONSTANT_Proc_,
;;	       ACTION_e_(CONSTANT_p_) ,
;;	       VARIABLE_lnbpart_[CONSTANT_p_]
;;	       = CONSTANT_Cardinality_(CONSTANT_NUnion_(VARIABLE_A2_)) ,
;;	       /\ VARIABLE_lnbpart_[CONSTANT_p_] =< VARIABLE_nbpart_[CONSTANT_p_]
;;	       /\ VARIABLE_nbpart_[CONSTANT_p_]
;;	          =< CONSTANT_Cardinality_(CONSTANT_NUnion_(VARIABLE_A2_)) ,
;;	       VARIABLE_lnbpart_[CONSTANT_p_] \in Nat
;;	       /\ VARIABLE_nbpart_[CONSTANT_p_] \in Nat 
;;	PROVE  VARIABLE_nbpart_[CONSTANT_p_]
;;	       = CONSTANT_Cardinality_(CONSTANT_NUnion_(VARIABLE_A2_))
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1731
;; Generated from file "./SnapShot_test.tla", line 2006, characters 11-12

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__h6fbaa () Idv)

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

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

;; Axiom: NatSetDef
(assert
  (!
    (forall ((smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x smt__TLA____NatSet)
          (and (smt__TLA____Mem smt__x smt__TLA____IntSet)
            (smt__TLA____IntLteq (smt__TLA____Cast__Int 0) smt__x)))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____NatSet))))
    :named |NatSetDef|))

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

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__Proc__ () Idv)

(declare-fun smt__CONSTANT__Val__ () Idv)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__NUnion__ (Idv) Idv)

(declare-fun smt__VARIABLE__result__ () Idv)

(declare-fun smt__VARIABLE__result____prime () Idv)

(declare-fun smt__VARIABLE__A2__ () Idv)

(declare-fun smt__VARIABLE__A2____prime () Idv)

(declare-fun smt__VARIABLE__A3__ () Idv)

(declare-fun smt__VARIABLE__A3____prime () Idv)

(declare-fun smt__VARIABLE__pc__ () Idv)

(declare-fun smt__VARIABLE__pc____prime () Idv)

(declare-fun smt__VARIABLE__myVals__ () Idv)

(declare-fun smt__VARIABLE__myVals____prime () Idv)

(declare-fun smt__VARIABLE__known__ () Idv)

(declare-fun smt__VARIABLE__known____prime () Idv)

(declare-fun smt__VARIABLE__notKnown__ () Idv)

(declare-fun smt__VARIABLE__notKnown____prime () Idv)

(declare-fun smt__VARIABLE__lnbpart__ () Idv)

(declare-fun smt__VARIABLE__lnbpart____prime () Idv)

(declare-fun smt__VARIABLE__nbpart__ () Idv)

(declare-fun smt__VARIABLE__nbpart____prime () Idv)

(declare-fun smt__VARIABLE__nextout__ () Idv)

(declare-fun smt__VARIABLE__nextout____prime () Idv)

(declare-fun smt__VARIABLE__out__ () Idv)

(declare-fun smt__VARIABLE__out____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__a__ (Idv) Idv)

(declare-fun smt__ACTION__b__ (Idv) Idv)

(declare-fun smt__ACTION__c__ (Idv) Idv)

(declare-fun smt__ACTION__d__ (Idv) Idv)

(declare-fun smt__ACTION__e__ (Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__Termination__ () Idv)

(declare-fun smt__CONSTANT__PUnion__ (Idv) Idv)

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__Inv1__ () Idv)

(declare-fun smt__CONSTANT__NotAProc__ () Idv)

(declare-fun smt__STATE__ReadyToWrite__ (Idv Idv) Idv)

(declare-fun smt__STATE__WriterAssignment__ () Idv)

(declare-fun smt__STATE__PV__ (Idv) Idv)

(declare-fun smt__STATE__PA3__ () Idv)

(declare-fun smt__STATE__Inv2__ () Idv)

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

; hidden fact

(declare-fun smt__STATE__pcBar__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Sexclamationmark__PUnion__ (Idv) Idv)

(declare-fun smt__STATE__Sexclamationmark__vars__ () Idv)

(declare-fun smt__STATE__Sexclamationmark__Init__ () Idv)

(declare-fun smt__ACTION__Sexclamationmark__A__ (Idv) Idv)

(declare-fun smt__ACTION__Sexclamationmark__B__ (Idv) Idv)

(declare-fun smt__ACTION__Sexclamationmark__C__ (Idv) Idv)

(declare-fun smt__ACTION__Sexclamationmark__Next__ () Idv)

(declare-fun smt__TEMPORAL__Sexclamationmark__Spec__ () Idv)

(declare-fun smt__STATE__Sexclamationmark__TypeOK__ () Idv)

(declare-fun smt__ACTION__Sexclamationmark__BigNext__ () Idv)

(declare-fun smt__TEMPORAL__Sexclamationmark__BigSpec__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (and
    (and (= smt__STATE__TypeOK__ smt__TLA____Tt__Idv)
      (= smt__STATE__Inv1__ smt__TLA____Tt__Idv))
    (= smt__STATE__Inv2__ smt__TLA____Tt__Idv)))

(assert
  (or (= smt__ACTION__Next__ smt__TLA____Tt__Idv)
    (= smt__TLA____Anon__OPAQUE__h6fbaa smt__STATE__vars__)))

; hidden fact

; hidden fact

(assert
  (and
    (and (= smt__STATE__TypeOK__ smt__TLA____Tt__Idv)
      (= smt__STATE__Inv1__ smt__TLA____Tt__Idv))
    (= smt__STATE__Inv2__ smt__TLA____Tt__Idv)))

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

(assert (= (smt__ACTION__e__ smt__CONSTANT__p__) smt__TLA____Tt__Idv))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (= (smt__TLA____FunApp smt__VARIABLE__lnbpart__ smt__CONSTANT__p__)
    (smt__CONSTANT__Cardinality__
      (smt__CONSTANT__NUnion__ smt__VARIABLE__A2__))))

(assert
  (and
    (smt__TLA____IntLteq
      (smt__TLA____FunApp smt__VARIABLE__lnbpart__ smt__CONSTANT__p__)
      (smt__TLA____FunApp smt__VARIABLE__nbpart__ smt__CONSTANT__p__))
    (smt__TLA____IntLteq
      (smt__TLA____FunApp smt__VARIABLE__nbpart__ smt__CONSTANT__p__)
      (smt__CONSTANT__Cardinality__
        (smt__CONSTANT__NUnion__ smt__VARIABLE__A2__)))))

(assert
  (and
    (smt__TLA____Mem
      (smt__TLA____FunApp smt__VARIABLE__lnbpart__ smt__CONSTANT__p__)
      smt__TLA____NatSet)
    (smt__TLA____Mem
      (smt__TLA____FunApp smt__VARIABLE__nbpart__ smt__CONSTANT__p__)
      smt__TLA____NatSet)))

;; Goal
(assert
  (!
    (not
      (= (smt__TLA____FunApp smt__VARIABLE__nbpart__ smt__CONSTANT__p__)
        (smt__CONSTANT__Cardinality__
          (smt__CONSTANT__NUnion__ smt__VARIABLE__A2__)))) :named |Goal|))

(check-sat)
(exit)
