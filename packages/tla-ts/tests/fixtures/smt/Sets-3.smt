;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Cardinality_(_),
;;	       CONSTANT_IsFiniteSet_({}) ,
;;	       CONSTANT_Cardinality_({}) = 0 ,
;;	       ASSUME NEW CONSTANT CONSTANT_S_,
;;	              CONSTANT_IsFiniteSet_(CONSTANT_S_) ,
;;	              CONSTANT_Cardinality_(CONSTANT_S_) = 0 
;;	       PROVE  CONSTANT_S_ = {} 
;;	PROVE  /\ CONSTANT_IsFiniteSet_({})
;;	       /\ CONSTANT_Cardinality_({}) = 0
;;	       /\ \A CONSTANT_S_ :
;;	             CONSTANT_IsFiniteSet_(CONSTANT_S_)
;;	             /\ CONSTANT_Cardinality_(CONSTANT_S_) = 0 => CONSTANT_S_ = {}
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #3
;; Generated from file "./Sets.tla", line 49, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetEnum__0 () Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ (Idv
  Idv) Bool)

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

;; Axiom: EnumDefElim 0
(assert
  (!
    (forall ((smt__x Idv))
      (! (not (smt__TLA____Mem smt__x smt__TLA____SetEnum__0))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____SetEnum__0))))
    :named |EnumDefElim 0|))

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

;; Axiom: ExtTrigEqDef Set$Idv$
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (!
        (= (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ smt__x smt__y)
          (= smt__x smt__y))
        :pattern ((smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ 
                    smt__x smt__y)))) :named |ExtTrigEqDef Set$Idv$|))

;; Axiom: ExtTrigEqTrigger Idv
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (! (smt__TLA____SetExtTrigger smt__x smt__y)
        :pattern ((smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ 
                    smt__x smt__y)))) :named |ExtTrigEqTrigger Idv|))

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

(declare-fun smt__CONSTANT__IsBijection__ (Idv Idv Idv) Idv)

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (= (smt__CONSTANT__IsFiniteSet__ smt__TLA____SetEnum__0)
    smt__TLA____Tt__Idv))

(assert
  (= (smt__CONSTANT__Cardinality__ smt__TLA____SetEnum__0)
    (smt__TLA____Cast__Int 0)))

(assert
  (forall ((smt__CONSTANT__S__ Idv))
    (=>
      (= (smt__CONSTANT__IsFiniteSet__ smt__CONSTANT__S__)
        smt__TLA____Tt__Idv)
      (=>
        (= (smt__CONSTANT__Cardinality__ smt__CONSTANT__S__)
          (smt__TLA____Cast__Int 0))
        (= smt__CONSTANT__S__ smt__TLA____SetEnum__0)))))

;; Goal
(assert
  (!
    (not
      (and
        (= (smt__CONSTANT__IsFiniteSet__ smt__TLA____SetEnum__0)
          smt__TLA____Tt__Idv)
        (= (smt__CONSTANT__Cardinality__ smt__TLA____SetEnum__0)
          (smt__TLA____Cast__Int 0))
        (forall ((smt__CONSTANT__S__ Idv))
          (=>
            (and
              (= (smt__CONSTANT__IsFiniteSet__ smt__CONSTANT__S__)
                smt__TLA____Tt__Idv)
              (= (smt__CONSTANT__Cardinality__ smt__CONSTANT__S__)
                (smt__TLA____Cast__Int 0)))
            (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__
              smt__CONSTANT__S__ smt__TLA____SetEnum__0))))) :named |Goal|))

(check-sat)
(exit)
