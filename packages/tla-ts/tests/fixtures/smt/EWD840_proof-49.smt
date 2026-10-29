;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_N_,
;;	       NEW VARIABLE VARIABLE_active_,
;;	       NEW VARIABLE VARIABLE_color_,
;;	       NEW VARIABLE VARIABLE_tpos_,
;;	       NEW VARIABLE VARIABLE_tcolor_,
;;	       CONSTANT_N_ \in Nat \ {0} ,
;;	       NEW CONSTANT CONSTANT_i_ \in CONSTANT_Node_,
;;	       VARIABLE_tpos_ < CONSTANT_i_ ,
;;	       CONSTANT_i_ < CONSTANT_N_ ,
;;	       \A CONSTANT_i__1 \in CONSTANT_Node_ :
;;	          VARIABLE_tpos_ < CONSTANT_i__1 => ~VARIABLE_active_[CONSTANT_i__1] 
;;	PROVE  ~VARIABLE_active_[CONSTANT_i_]
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #49
;; Generated from file "./EWD840_proof.tla", line 81, characters 15-16

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

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

(declare-fun smt__TLA____SetEnum__1 (Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____SetMinus (Idv Idv) Idv)

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

;; Axiom: SetMinusDef
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____SetMinus smt__a smt__b))
          (and (smt__TLA____Mem smt__x smt__a)
            (not (smt__TLA____Mem smt__x smt__b))))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetMinus smt__a smt__b)))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____SetMinus smt__a smt__b))
        :pattern ((smt__TLA____Mem smt__x smt__b)
                   (smt__TLA____SetMinus smt__a smt__b))))
    :named |SetMinusDef|))

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

;; Axiom: EnumDefIntro 1
(assert
  (!
    (forall ((smt__a1 Idv))
      (! (smt__TLA____Mem smt__a1 (smt__TLA____SetEnum__1 smt__a1))
        :pattern ((smt__TLA____SetEnum__1 smt__a1)))) :named |EnumDefIntro 1|))

;; Axiom: EnumDefElim 1
(assert
  (!
    (forall ((smt__a1 Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x (smt__TLA____SetEnum__1 smt__a1))
          (= smt__x smt__a1))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____SetEnum__1 smt__a1)))))
    :named |EnumDefElim 1|))

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

(declare-fun smt__CONSTANT__N__ () Idv)

; hidden fact

(declare-fun smt__VARIABLE__active__ () Idv)

(declare-fun smt__VARIABLE__active____prime () Idv)

(declare-fun smt__VARIABLE__color__ () Idv)

(declare-fun smt__VARIABLE__color____prime () Idv)

(declare-fun smt__VARIABLE__tpos__ () Idv)

(declare-fun smt__VARIABLE__tpos____prime () Idv)

(declare-fun smt__VARIABLE__tcolor__ () Idv)

(declare-fun smt__VARIABLE__tcolor____prime () Idv)

(declare-fun smt__CONSTANT__Node__ () Idv)

(declare-fun smt__CONSTANT__Color__ () Idv)

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__InitiateProbe__ () Idv)

(declare-fun smt__ACTION__PassToken__ (Idv) Idv)

(declare-fun smt__ACTION__System__ () Idv)

(declare-fun smt__ACTION__SendMsg__ (Idv) Idv)

(declare-fun smt__ACTION__Deactivate__ (Idv) Idv)

(declare-fun smt__ACTION__Environment__ () Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__TokenAlwaysBlack__ () Idv)

(declare-fun smt__TEMPORAL__NeverChangeColor__ () Idv)

(declare-fun smt__STATE__terminated__ () Idv)

(declare-fun smt__STATE__terminationDetected__ () Idv)

(declare-fun smt__STATE__TerminationDetection__ () Idv)

(declare-fun smt__TEMPORAL__Liveness__ () Idv)

(declare-fun smt__TEMPORAL__FalseLiveness__ () Idv)

(declare-fun smt__TEMPORAL__SpecWFNext__ () Idv)

(declare-fun smt__TEMPORAL__AllNodesTerminateIfNoMessages__ () Idv)

(declare-fun smt__STATE__Inv__ () Idv)

(declare-fun smt__TEMPORAL__CheckInductiveSpec__ () Idv)

(declare-fun smt__CONSTANT__TDexclamationmark__Node__ () Idv)

(declare-fun smt__STATE__TDexclamationmark__TypeOK__ () Idv)

(declare-fun smt__STATE__TDexclamationmark__terminated__ () Idv)

(declare-fun smt__STATE__TDexclamationmark__Init__ () Idv)

(declare-fun smt__ACTION__TDexclamationmark__Terminate__ (Idv) Idv)

(declare-fun smt__ACTION__TDexclamationmark__Wakeup__ (Idv Idv) Idv)

(declare-fun smt__ACTION__TDexclamationmark__DetectTermination__ () Idv)

(declare-fun smt__ACTION__TDexclamationmark__Next__ () Idv)

(declare-fun smt__STATE__TDexclamationmark__vars__ () Idv)

(declare-fun smt__TEMPORAL__TDexclamationmark__Spec__ () Idv)

(declare-fun smt__STATE__TDexclamationmark__TDCorrect__ () Idv)

(declare-fun smt__TEMPORAL__TDexclamationmark__Quiescence__ () Idv)

(declare-fun smt__TEMPORAL__TDexclamationmark__Liveness__ () Idv)

(declare-fun smt__TEMPORAL__TDSpec__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_NatInductiveDefHypothesis_' (second-order)

; omitted declaration of 'CONSTANT_NatInductiveDefConclusion_' (second-order)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_FiniteNatInductiveDefHypothesis_' (second-order)

; omitted declaration of 'CONSTANT_FiniteNatInductiveDefConclusion_' (second-order)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(assert
  (smt__TLA____Mem smt__CONSTANT__N__
    (smt__TLA____SetMinus smt__TLA____NatSet
      (smt__TLA____SetEnum__1 (smt__TLA____Cast__Int 0)))))

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

(declare-fun smt__CONSTANT__i__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__i__ smt__CONSTANT__Node__))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (and (smt__TLA____IntLteq smt__VARIABLE__tpos__ smt__CONSTANT__i__)
    (distinct smt__VARIABLE__tpos__ smt__CONSTANT__i__)))

(assert
  (and (smt__TLA____IntLteq smt__CONSTANT__i__ smt__CONSTANT__N__)
    (distinct smt__CONSTANT__i__ smt__CONSTANT__N__)))

(assert
  (forall ((smt__CONSTANT__i___1 Idv))
    (=> (smt__TLA____Mem smt__CONSTANT__i___1 smt__CONSTANT__Node__)
      (=>
        (and (smt__TLA____IntLteq smt__VARIABLE__tpos__ smt__CONSTANT__i___1)
          (distinct smt__VARIABLE__tpos__ smt__CONSTANT__i___1))
        (not
          (=
            (smt__TLA____FunApp smt__VARIABLE__active__ smt__CONSTANT__i___1)
            smt__TLA____Tt__Idv))))))

;; Goal
(assert
  (!
    (not
      (not
        (= (smt__TLA____FunApp smt__VARIABLE__active__ smt__CONSTANT__i__)
          smt__TLA____Tt__Idv))) :named |Goal|))

(check-sat)
(exit)
