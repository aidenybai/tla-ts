;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       CONSTANT_IsFiniteSet_(CONSTANT_S_) ,
;;	       NEW CONSTANT CONSTANT_op_(_),
;;	       \A CONSTANT_s_ \in CONSTANT_S_ : CONSTANT_op_(CONSTANT_s_) \in Int ,
;;	       \A CONSTANT_T_ \in SUBSET CONSTANT_S_ :
;;	          CONSTANT_T_ # {}
;;	          => (CHOOSE CONSTANT_x_ \in CONSTANT_T_ : TRUE) \in CONSTANT_T_ 
;;	PROVE  /\ 0 \in Int
;;	       /\ \A CONSTANT_i_, CONSTANT_j_ \in Int :
;;	             CONSTANT_i_ + CONSTANT_j_ \in Int
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #202
;; Generated from file "./FiniteSetsExtTheorems_proofs.tla", line 340, characters 3-9

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

; omitted declaration of 'TLA__Choose' (second-order)

(declare-fun smt__TLA____IntPlus (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetEnum__0 () Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____Subset (Idv) Idv)

(declare-fun smt__TLA____SubsetEq (Idv Idv) Bool)

(declare-fun smt__TLA____Tt__Idv () Idv)

; omitted fact (second-order)

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

;; Axiom: SubsetEqIntro
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (!
        (=>
          (forall ((smt__z Idv))
            (=> (smt__TLA____Mem smt__z smt__x)
              (smt__TLA____Mem smt__z smt__y)))
          (smt__TLA____SubsetEq smt__x smt__y))
        :pattern ((smt__TLA____SubsetEq smt__x smt__y))))
    :named |SubsetEqIntro|))

;; Axiom: SubsetEqElim
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv) (smt__z Idv))
      (!
        (=>
          (and (smt__TLA____SubsetEq smt__x smt__y)
            (smt__TLA____Mem smt__z smt__x)) (smt__TLA____Mem smt__z smt__y))
        :pattern ((smt__TLA____SubsetEq smt__x smt__y)
                   (smt__TLA____Mem smt__z smt__x)))) :named |SubsetEqElim|))

;; Axiom: SubsetDefAlt
(assert
  (!
    (forall ((smt__a Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____Subset smt__a))
          (smt__TLA____SubsetEq smt__x smt__a))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____Subset smt__a)))
        :pattern ((smt__TLA____SubsetEq smt__x smt__a)
                   (smt__TLA____Subset smt__a)))) :named |SubsetDefAlt|))

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

; omitted declaration of 'CONSTANT_FoldSet_' (second-order)

(declare-fun smt__CONSTANT__SumSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__ProductSet__ (Idv) Idv)

; omitted declaration of 'CONSTANT_ReduceSet_' (second-order)

; omitted declaration of 'CONSTANT_MapThenSumSet_' (second-order)

(declare-fun smt__CONSTANT__FlattenSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__SymDiff__ (Idv Idv) Idv)

; omitted declaration of 'CONSTANT_Quantify_' (second-order)

(declare-fun smt__CONSTANT__kSubset__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__Max__ (Idv) Idv)

(declare-fun smt__CONSTANT__Min__ (Idv) Idv)

(declare-fun smt__CONSTANT__Choices__ (Idv) Idv)

; omitted declaration of 'CONSTANT_ChooseUnique_' (second-order)

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

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

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

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__S__ () Idv)

(assert
  (= (smt__CONSTANT__IsFiniteSet__ smt__CONSTANT__S__) smt__TLA____Tt__Idv))

(declare-fun smt__CONSTANT__op__ (Idv) Idv)

(assert
  (forall ((smt__CONSTANT__s__ Idv))
    (=> (smt__TLA____Mem smt__CONSTANT__s__ smt__CONSTANT__S__)
      (smt__TLA____Mem (smt__CONSTANT__op__ smt__CONSTANT__s__)
        smt__TLA____IntSet))))

(declare-fun smt__TLA____Choose__flatnd__1 (Idv) Idv)

;; Axiom: ChooseDef TLA__Choose_flatnd_1
(assert
  (!
    (forall ((smt__CONSTANT__T__ Idv) (smt__x Idv))
      (=> (and (smt__TLA____Mem smt__x smt__CONSTANT__T__) true)
        (and
          (smt__TLA____Mem (smt__TLA____Choose__flatnd__1 smt__CONSTANT__T__)
            smt__CONSTANT__T__) true)))
    :named |ChooseDef TLA__Choose_flatnd_1|))

(assert
  (forall ((smt__CONSTANT__T__ Idv))
    (=>
      (smt__TLA____Mem smt__CONSTANT__T__
        (smt__TLA____Subset smt__CONSTANT__S__))
      (=> (distinct smt__CONSTANT__T__ smt__TLA____SetEnum__0)
        (smt__TLA____Mem (smt__TLA____Choose__flatnd__1 smt__CONSTANT__T__)
          smt__CONSTANT__T__)))))

; hidden fact

; hidden fact

;; Goal
(assert
  (!
    (not
      (and (smt__TLA____Mem (smt__TLA____Cast__Int 0) smt__TLA____IntSet)
        (forall ((smt__CONSTANT__i__ Idv) (smt__CONSTANT__j__ Idv))
          (=>
            (and (smt__TLA____Mem smt__CONSTANT__i__ smt__TLA____IntSet)
              (smt__TLA____Mem smt__CONSTANT__j__ smt__TLA____IntSet))
            (smt__TLA____Mem
              (smt__TLA____IntPlus smt__CONSTANT__i__ smt__CONSTANT__j__)
              smt__TLA____IntSet))))) :named |Goal|))

(check-sat)
(exit)
