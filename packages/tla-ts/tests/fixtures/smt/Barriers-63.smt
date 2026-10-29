;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_N_,
;;	       NEW VARIABLE VARIABLE_pc_,
;;	       NEW VARIABLE VARIABLE_lock_,
;;	       NEW VARIABLE VARIABLE_gate_1_,
;;	       NEW VARIABLE VARIABLE_gate_2_,
;;	       NEW VARIABLE VARIABLE_rdv_,
;;	       CONSTANT_N_ \in Nat \ {0} ,
;;	       ASSUME NEW CONSTANT CONSTANT_a_ \in Int,
;;	              NEW CONSTANT CONSTANT_b_ \in Int
;;	       PROVE  /\ CONSTANT_IsFiniteSet_(CONSTANT_a_..CONSTANT_b_)
;;	              /\ CONSTANT_Cardinality_(CONSTANT_a_..CONSTANT_b_)
;;	                 = (IF CONSTANT_a_ > CONSTANT_b_
;;	                      THEN 0
;;	                      ELSE CONSTANT_b_ - CONSTANT_a_ + 1) 
;;	PROVE  /\ CONSTANT_IsFiniteSet_(1..CONSTANT_N_)
;;	       /\ CONSTANT_Cardinality_(1..CONSTANT_N_) = CONSTANT_N_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #63
;; Generated from file "./Barriers.tla", line 339, characters 5-6

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntMinus (Idv Idv) Idv)

(declare-fun smt__TLA____IntPlus (Idv Idv) Idv)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

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

;; Axiom: IntRangeDef
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____IntRange smt__a smt__b))
          (and (smt__TLA____Mem smt__x smt__TLA____IntSet)
            (smt__TLA____IntLteq smt__a smt__x)
            (smt__TLA____IntLteq smt__x smt__b)))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____IntRange smt__a smt__b)))))
    :named |IntRangeDef|))

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

;; Axiom: Typing TIntPlus
(assert
  (!
    (forall ((smt__x1 Int) (smt__x2 Int))
      (!
        (=
          (smt__TLA____IntPlus (smt__TLA____Cast__Int smt__x1)
            (smt__TLA____Cast__Int smt__x2))
          (smt__TLA____Cast__Int (+ smt__x1 smt__x2)))
        :pattern ((smt__TLA____IntPlus (smt__TLA____Cast__Int smt__x1)
                    (smt__TLA____Cast__Int smt__x2)))))
    :named |Typing TIntPlus|))

;; Axiom: Typing TIntMinus
(assert
  (!
    (forall ((smt__x1 Int) (smt__x2 Int))
      (!
        (=
          (smt__TLA____IntMinus (smt__TLA____Cast__Int smt__x1)
            (smt__TLA____Cast__Int smt__x2))
          (smt__TLA____Cast__Int (- smt__x1 smt__x2)))
        :pattern ((smt__TLA____IntMinus (smt__TLA____Cast__Int smt__x1)
                    (smt__TLA____Cast__Int smt__x2)))))
    :named |Typing TIntMinus|))

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

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

; omitted declaration of 'CONSTANT_MapThenFoldSet_' (second-order)

(declare-fun smt__CONSTANT__Restrict__ (Idv Idv) Idv)

; omitted declaration of 'CONSTANT_RestrictDomain_' (second-order)

; omitted declaration of 'CONSTANT_RestrictValues_' (second-order)

(declare-fun smt__CONSTANT__IsRestriction__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__Range__ (Idv) Idv)

; omitted declaration of 'CONSTANT_Pointwise_' (second-order)

(declare-fun smt__CONSTANT__Inverse__ (Idv Idv Idv) Idv)

(declare-fun smt__CONSTANT__AntiFunction__ (Idv) Idv)

(declare-fun smt__CONSTANT__IsInjective__ (Idv) Idv)

(declare-fun smt__CONSTANT__Injection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__Surjection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__Bijection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__ExistsInjection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__ExistsSurjection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__ExistsBijection__ (Idv Idv) Idv)

; omitted declaration of 'CONSTANT_FoldFunctionOnSet_' (second-order)

; omitted declaration of 'CONSTANT_FoldFunction_' (second-order)

(declare-fun smt__CONSTANT__SumFunctionOnSet__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__SumFunction__ (Idv) Idv)

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

(declare-fun smt__CONSTANT__IsTransitivelyClosedOn__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__IsWellFoundedOn__ (Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__SetLessThan__ (Idv Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_WFDefOn_' (second-order)

; omitted declaration of 'CONSTANT_OpDefinesFcn_' (second-order)

; omitted declaration of 'CONSTANT_WFInductiveDefines_' (second-order)

; omitted declaration of 'CONSTANT_WFInductiveUnique_' (second-order)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__TransitiveClosureOn__ (Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_OpToRel_' (second-order)

; hidden fact

; omitted declaration of 'CONSTANT_PreImage_' (second-order)

; hidden fact

(declare-fun smt__CONSTANT__LexPairOrdering__ (Idv Idv Idv Idv) Idv)

; hidden fact

(declare-fun smt__CONSTANT__LexProductOrdering__ (Idv Idv Idv) Idv)

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

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__FiniteSubsetsOf__ (Idv) Idv)

(declare-fun smt__CONSTANT__StrictSubsetOrdering__ (Idv) Idv)

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

(declare-fun smt__CONSTANT__N__ () Idv)

(declare-fun smt__VARIABLE__pc__ () Idv)

(declare-fun smt__VARIABLE__pc____prime () Idv)

(declare-fun smt__VARIABLE__lock__ () Idv)

(declare-fun smt__VARIABLE__lock____prime () Idv)

(declare-fun smt__VARIABLE__gate__1__ () Idv)

(declare-fun smt__VARIABLE__gate__1____prime () Idv)

(declare-fun smt__VARIABLE__gate__2__ () Idv)

(declare-fun smt__VARIABLE__gate__2____prime () Idv)

(declare-fun smt__VARIABLE__rdv__ () Idv)

(declare-fun smt__VARIABLE__rdv____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__a0__ (Idv) Idv)

(declare-fun smt__ACTION__a1__ (Idv) Idv)

(declare-fun smt__ACTION__a2__ (Idv) Idv)

(declare-fun smt__ACTION__a3__ (Idv) Idv)

(declare-fun smt__ACTION__a4__ (Idv) Idv)

(declare-fun smt__ACTION__a5__ (Idv) Idv)

(declare-fun smt__ACTION__a6__ (Idv) Idv)

(declare-fun smt__ACTION__a7__ (Idv) Idv)

(declare-fun smt__ACTION__a8__ (Idv) Idv)

(declare-fun smt__ACTION__a9__ (Idv) Idv)

(declare-fun smt__ACTION__a10__ (Idv) Idv)

(declare-fun smt__ACTION__a11__ (Idv) Idv)

(declare-fun smt__ACTION__a12__ (Idv) Idv)

(declare-fun smt__ACTION__proc__ (Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__lockcs__ (Idv) Idv)

(declare-fun smt__STATE__ProcsInLockCS__ () Idv)

(declare-fun smt__STATE__LockInv__ () Idv)

(declare-fun smt__STATE__rdvsection__ (Idv) Idv)

(declare-fun smt__STATE__ProcsInRdv__ () Idv)

(declare-fun smt__STATE__barrier1__ (Idv) Idv)

(declare-fun smt__STATE__ProcsInB1__ () Idv)

(declare-fun smt__STATE__barrier2__ (Idv) Idv)

(declare-fun smt__STATE__ProcsInB2__ () Idv)

(declare-fun smt__STATE__Inv__ () Idv)

(declare-fun smt__STATE__FlushInv__ () Idv)

(declare-fun smt__STATE__pc__translation__ (Idv) Idv)

(declare-fun smt__STATE__Bexclamationmark__vars__ () Idv)

(declare-fun smt__CONSTANT__Bexclamationmark__ProcSet__ () Idv)

(declare-fun smt__STATE__Bexclamationmark__Init__ () Idv)

(declare-fun smt__ACTION__Bexclamationmark__b0__ (Idv) Idv)

(declare-fun smt__ACTION__Bexclamationmark__b1__ () Idv)

(declare-fun smt__ACTION__Bexclamationmark__Next__ () Idv)

(declare-fun smt__TEMPORAL__Bexclamationmark__Spec__ () Idv)

(declare-fun smt__STATE__Bexclamationmark__TypeOK__ () Idv)

(declare-fun smt__TEMPORAL__Bexclamationmark__BarrierProperty__ () Idv)

(declare-fun smt__TEMPORAL__BSpec__ () Idv)

; hidden fact

; hidden fact

; hidden fact

(assert
  (smt__TLA____Mem smt__CONSTANT__N__
    (smt__TLA____SetMinus smt__TLA____NatSet
      (smt__TLA____SetEnum__1 (smt__TLA____Cast__Int 0)))))

; hidden fact

; hidden fact

; hidden fact

(assert
  (forall ((smt__CONSTANT__a__ Idv))
    (=> (smt__TLA____Mem smt__CONSTANT__a__ smt__TLA____IntSet)
      (forall ((smt__CONSTANT__b__ Idv))
        (=> (smt__TLA____Mem smt__CONSTANT__b__ smt__TLA____IntSet)
          (and
            (=
              (smt__CONSTANT__IsFiniteSet__
                (smt__TLA____IntRange smt__CONSTANT__a__ smt__CONSTANT__b__))
              smt__TLA____Tt__Idv)
            (=
              (smt__CONSTANT__Cardinality__
                (smt__TLA____IntRange smt__CONSTANT__a__ smt__CONSTANT__b__))
              (ite
                (and
                  (smt__TLA____IntLteq smt__CONSTANT__b__ smt__CONSTANT__a__)
                  (distinct smt__CONSTANT__b__ smt__CONSTANT__a__))
                (smt__TLA____Cast__Int 0)
                (smt__TLA____IntPlus
                  (smt__TLA____IntMinus smt__CONSTANT__b__ smt__CONSTANT__a__)
                  (smt__TLA____Cast__Int 1))))))))))

;; Goal
(assert
  (!
    (not
      (and
        (=
          (smt__CONSTANT__IsFiniteSet__
            (smt__TLA____IntRange (smt__TLA____Cast__Int 1)
              smt__CONSTANT__N__)) smt__TLA____Tt__Idv)
        (=
          (smt__CONSTANT__Cardinality__
            (smt__TLA____IntRange (smt__TLA____Cast__Int 1)
              smt__CONSTANT__N__)) smt__CONSTANT__N__))) :named |Goal|))

(check-sat)
(exit)
