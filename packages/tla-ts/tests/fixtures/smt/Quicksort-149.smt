;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Values_,
;;	       NEW VARIABLE VARIABLE_pc_,
;;	       NEW VARIABLE VARIABLE_seq_,
;;	       NEW VARIABLE VARIABLE_seq0_,
;;	       NEW VARIABLE VARIABLE_U_,
;;	       STATE_Inv_ ,
;;	       ACTION_Next_ \/ ?h6fbaa = STATE_vars_ ,
;;	       IF VARIABLE_U_ # {}
;;	         THEN /\ \E CONSTANT_I_ \in VARIABLE_U_ :
;;	                    IF CONSTANT_Cardinality_(CONSTANT_I_) = 1
;;	                      THEN /\ ?VARIABLE_U_#prime
;;	                              = VARIABLE_U_ \ {CONSTANT_I_}
;;	                           /\ ?VARIABLE_seq_#prime = VARIABLE_seq_
;;	                      ELSE /\ \E CONSTANT_p_
;;	                                 \in CONSTANT_Min_(CONSTANT_I_)..CONSTANT_Max_
;;	                                                                   (CONSTANT_I_)
;;	                                                                 - 1 :
;;	                                 \E CONSTANT_newseq_
;;	                                    \in CONSTANT_Partitions_(CONSTANT_I_,
;;	                                                             CONSTANT_p_,
;;	                                                             VARIABLE_seq_) :
;;	                                    /\ ?VARIABLE_seq_#prime
;;	                                       = CONSTANT_newseq_
;;	                                    /\ ?VARIABLE_U_#prime
;;	                                       = (VARIABLE_U_ \ {CONSTANT_I_})
;;	                                         \cup {CONSTANT_Min_(CONSTANT_I_)..CONSTANT_p_,
;;	                                               CONSTANT_p_ + 1..CONSTANT_Max_
;;	                                                                  (CONSTANT_I_)}
;;	              /\ ?VARIABLE_pc_#prime = "a"
;;	         ELSE /\ ?VARIABLE_pc_#prime = "Done"
;;	              /\ /\ ?VARIABLE_seq_#prime = VARIABLE_seq_
;;	                 /\ ?VARIABLE_U_#prime = VARIABLE_U_ ,
;;	       VARIABLE_pc_ = "a" ,
;;	       ?VARIABLE_seq0_#prime = VARIABLE_seq0_ ,
;;	       VARIABLE_U_ # {} 
;;	PROVE  \E CONSTANT_I_ \in VARIABLE_U_ :
;;	          IF CONSTANT_Cardinality_(CONSTANT_I_) = 1
;;	            THEN /\ ?VARIABLE_U_#prime = VARIABLE_U_ \ {CONSTANT_I_}
;;	                 /\ ?VARIABLE_seq_#prime = VARIABLE_seq_
;;	            ELSE /\ \E CONSTANT_p_
;;	                       \in CONSTANT_Min_(CONSTANT_I_)..CONSTANT_Max_(CONSTANT_I_)
;;	                                                       - 1 :
;;	                       \E CONSTANT_newseq_
;;	                          \in CONSTANT_Partitions_(CONSTANT_I_, CONSTANT_p_,
;;	                                                   VARIABLE_seq_) :
;;	                          /\ ?VARIABLE_seq_#prime = CONSTANT_newseq_
;;	                          /\ ?VARIABLE_U_#prime
;;	                             = (VARIABLE_U_ \ {CONSTANT_I_})
;;	                               \cup {CONSTANT_Min_(CONSTANT_I_)..CONSTANT_p_,
;;	                                     CONSTANT_p_ + 1..CONSTANT_Max_(CONSTANT_I_)}
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #149
;; Generated from file "./Quicksort.tla", line 396, characters 9-10

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__h6fbaa () Idv)

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____Cup (Idv Idv) Idv)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntMinus (Idv Idv) Idv)

(declare-fun smt__TLA____IntPlus (Idv Idv) Idv)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetEnum__0 () Idv)

(declare-fun smt__TLA____SetEnum__1 (Idv) Idv)

(declare-fun smt__TLA____SetEnum__2 (Idv Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____SetMinus (Idv Idv) Idv)

(declare-fun smt__TLA____StrLit__Done () Idv)

(declare-fun smt__TLA____StrLit__a () Idv)

(declare-fun smt__TLA____StrSet () Idv)

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

;; Axiom: CupDef
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____Cup smt__a smt__b))
          (or (smt__TLA____Mem smt__x smt__a) (smt__TLA____Mem smt__x smt__b)))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____Cup smt__a smt__b)))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____Cup smt__a smt__b))
        :pattern ((smt__TLA____Mem smt__x smt__b)
                   (smt__TLA____Cup smt__a smt__b)))) :named |CupDef|))

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

;; Axiom: EnumDefIntro 2
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv))
      (!
        (and
          (smt__TLA____Mem smt__a1 (smt__TLA____SetEnum__2 smt__a1 smt__a2))
          (smt__TLA____Mem smt__a2 (smt__TLA____SetEnum__2 smt__a1 smt__a2)))
        :pattern ((smt__TLA____SetEnum__2 smt__a1 smt__a2))))
    :named |EnumDefIntro 2|))

;; Axiom: EnumDefElim 0
(assert
  (!
    (forall ((smt__x Idv))
      (! (not (smt__TLA____Mem smt__x smt__TLA____SetEnum__0))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____SetEnum__0))))
    :named |EnumDefElim 0|))

;; Axiom: EnumDefElim 1
(assert
  (!
    (forall ((smt__a1 Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x (smt__TLA____SetEnum__1 smt__a1))
          (= smt__x smt__a1))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____SetEnum__1 smt__a1)))))
    :named |EnumDefElim 1|))

;; Axiom: EnumDefElim 2
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x (smt__TLA____SetEnum__2 smt__a1 smt__a2))
          (or (= smt__x smt__a1) (= smt__x smt__a2)))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetEnum__2 smt__a1 smt__a2)))))
    :named |EnumDefElim 2|))

;; Axiom: StrLitIsstr Done
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__Done smt__TLA____StrSet)
    :named |StrLitIsstr Done|))

;; Axiom: StrLitIsstr a
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__a smt__TLA____StrSet)
    :named |StrLitIsstr a|))

;; Axiom: StrLitDistinct Done a
(assert
  (! (distinct smt__TLA____StrLit__Done smt__TLA____StrLit__a)
    :named |StrLitDistinct Done a|))

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

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

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

(declare-fun smt__CONSTANT__Values__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Automorphisms__ (Idv) Idv)

(declare-fun smt__CONSTANT__asterisk__asterisk____ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__PermsOf__ (Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Max__ (Idv) Idv)

(declare-fun smt__CONSTANT__Min__ (Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Partitions__ (Idv Idv Idv) Idv)

; hidden fact

(declare-fun smt__VARIABLE__pc__ () Idv)

(declare-fun smt__VARIABLE__pc____prime () Idv)

(declare-fun smt__VARIABLE__seq__ () Idv)

(declare-fun smt__VARIABLE__seq____prime () Idv)

(declare-fun smt__VARIABLE__seq0__ () Idv)

(declare-fun smt__VARIABLE__seq0____prime () Idv)

(declare-fun smt__VARIABLE__U__ () Idv)

(declare-fun smt__VARIABLE__U____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__Terminating__ () Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__Termination__ () Idv)

(declare-fun smt__STATE__PCorrect__ () Idv)

(declare-fun smt__STATE__UV__ () Idv)

(declare-fun smt__STATE__DomainPartitions__ () Idv)

(declare-fun smt__STATE__RelSorted__ (Idv Idv) Idv)

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__Inv__ () Idv)

; hidden fact

; hidden fact

; hidden fact

(assert (= smt__STATE__Inv__ smt__TLA____Tt__Idv))

(assert
  (or (= smt__ACTION__Next__ smt__TLA____Tt__Idv)
    (= smt__TLA____Anon__OPAQUE__h6fbaa smt__STATE__vars__)))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (ite
    (not
      (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ smt__VARIABLE__U__
        smt__TLA____SetEnum__0))
    (and
      (exists ((smt__CONSTANT__I__ Idv))
        (and (smt__TLA____Mem smt__CONSTANT__I__ smt__VARIABLE__U__)
          (ite
            (= (smt__CONSTANT__Cardinality__ smt__CONSTANT__I__)
              (smt__TLA____Cast__Int 1))
            (and
              (= smt__VARIABLE__U____prime
                (smt__TLA____SetMinus smt__VARIABLE__U__
                  (smt__TLA____SetEnum__1 smt__CONSTANT__I__)))
              (= smt__VARIABLE__seq____prime smt__VARIABLE__seq__))
            (exists ((smt__CONSTANT__p__ Idv))
              (and
                (smt__TLA____Mem smt__CONSTANT__p__
                  (smt__TLA____IntRange
                    (smt__CONSTANT__Min__ smt__CONSTANT__I__)
                    (smt__TLA____IntMinus
                      (smt__CONSTANT__Max__ smt__CONSTANT__I__)
                      (smt__TLA____Cast__Int 1))))
                (exists ((smt__CONSTANT__newseq__ Idv))
                  (and
                    (smt__TLA____Mem smt__CONSTANT__newseq__
                      (smt__CONSTANT__Partitions__ smt__CONSTANT__I__
                        smt__CONSTANT__p__ smt__VARIABLE__seq__))
                    (and
                      (= smt__VARIABLE__seq____prime smt__CONSTANT__newseq__)
                      (= smt__VARIABLE__U____prime
                        (smt__TLA____Cup
                          (smt__TLA____SetMinus smt__VARIABLE__U__
                            (smt__TLA____SetEnum__1 smt__CONSTANT__I__))
                          (smt__TLA____SetEnum__2
                            (smt__TLA____IntRange
                              (smt__CONSTANT__Min__ smt__CONSTANT__I__)
                              smt__CONSTANT__p__)
                            (smt__TLA____IntRange
                              (smt__TLA____IntPlus smt__CONSTANT__p__
                                (smt__TLA____Cast__Int 1))
                              (smt__CONSTANT__Max__ smt__CONSTANT__I__)))))))))))))
      (= smt__VARIABLE__pc____prime smt__TLA____StrLit__a))
    (and (= smt__VARIABLE__pc____prime smt__TLA____StrLit__Done)
      (and (= smt__VARIABLE__seq____prime smt__VARIABLE__seq__)
        (= smt__VARIABLE__U____prime smt__VARIABLE__U__)))))

(assert (= smt__VARIABLE__pc__ smt__TLA____StrLit__a))

(assert (= smt__VARIABLE__seq0____prime smt__VARIABLE__seq0__))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (not
    (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ smt__VARIABLE__U__
      smt__TLA____SetEnum__0)))

;; Goal
(assert
  (!
    (not
      (exists ((smt__CONSTANT__I__ Idv))
        (and (smt__TLA____Mem smt__CONSTANT__I__ smt__VARIABLE__U__)
          (ite
            (= (smt__CONSTANT__Cardinality__ smt__CONSTANT__I__)
              (smt__TLA____Cast__Int 1))
            (and
              (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__
                smt__VARIABLE__U____prime
                (smt__TLA____SetMinus smt__VARIABLE__U__
                  (smt__TLA____SetEnum__1 smt__CONSTANT__I__)))
              (= smt__VARIABLE__seq____prime smt__VARIABLE__seq__))
            (exists ((smt__CONSTANT__p__ Idv))
              (and
                (smt__TLA____Mem smt__CONSTANT__p__
                  (smt__TLA____IntRange
                    (smt__CONSTANT__Min__ smt__CONSTANT__I__)
                    (smt__TLA____IntMinus
                      (smt__CONSTANT__Max__ smt__CONSTANT__I__)
                      (smt__TLA____Cast__Int 1))))
                (exists ((smt__CONSTANT__newseq__ Idv))
                  (and
                    (smt__TLA____Mem smt__CONSTANT__newseq__
                      (smt__CONSTANT__Partitions__ smt__CONSTANT__I__
                        smt__CONSTANT__p__ smt__VARIABLE__seq__))
                    (and
                      (= smt__VARIABLE__seq____prime smt__CONSTANT__newseq__)
                      (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__
                        smt__VARIABLE__U____prime
                        (smt__TLA____Cup
                          (smt__TLA____SetMinus smt__VARIABLE__U__
                            (smt__TLA____SetEnum__1 smt__CONSTANT__I__))
                          (smt__TLA____SetEnum__2
                            (smt__TLA____IntRange
                              (smt__CONSTANT__Min__ smt__CONSTANT__I__)
                              smt__CONSTANT__p__)
                            (smt__TLA____IntRange
                              (smt__TLA____IntPlus smt__CONSTANT__p__
                                (smt__TLA____Cast__Int 1))
                              (smt__CONSTANT__Max__ smt__CONSTANT__I__))))))))))))))
    :named |Goal|))

(check-sat)
(exit)
