;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Value_,
;;	       NEW CONSTANT CONSTANT_Acceptor_,
;;	       NEW CONSTANT CONSTANT_Quorum_,
;;	       NEW VARIABLE VARIABLE_votes_,
;;	       NEW VARIABLE VARIABLE_maxBal_,
;;	       STATE_TypeOK_ ,
;;	       STATE_VInv1_ ,
;;	       STATE_VInv2_ ,
;;	       NEW CONSTANT CONSTANT_v_ \in CONSTANT_Value_,
;;	       NEW CONSTANT CONSTANT_w_ \in CONSTANT_Value_,
;;	       NEW CONSTANT CONSTANT_b_ \in Nat,
;;	       ASSUME NEW CONSTANT CONSTANT_c_ \in Nat,
;;	              CONSTANT_b_ > CONSTANT_c_ ,
;;	              STATE_SafeAt_(CONSTANT_b_, CONSTANT_v_) ,
;;	              STATE_ChosenIn_(CONSTANT_c_, CONSTANT_w_) 
;;	       PROVE  CONSTANT_v_ = CONSTANT_w_ 
;;	PROVE  \A CONSTANT_c_ \in Nat :
;;	          CONSTANT_b_ > CONSTANT_c_
;;	          /\ STATE_SafeAt_(CONSTANT_b_, CONSTANT_v_)
;;	          /\ STATE_ChosenIn_(CONSTANT_c_, CONSTANT_w_)
;;	          => CONSTANT_v_ = CONSTANT_w_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #82
;; Generated from file "./VoteProof.tla", line 484, characters 7-13

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

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

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__Value__ () Idv)

(declare-fun smt__CONSTANT__Acceptor__ () Idv)

(declare-fun smt__CONSTANT__Quorum__ () Idv)

; hidden fact

; hidden fact

(declare-fun smt__VARIABLE__votes__ () Idv)

(declare-fun smt__VARIABLE__votes____prime () Idv)

(declare-fun smt__VARIABLE__maxBal__ () Idv)

(declare-fun smt__VARIABLE__maxBal____prime () Idv)

(declare-fun smt__STATE__VotedFor__ (Idv Idv Idv) Idv)

(declare-fun smt__STATE__DidNotVoteIn__ (Idv Idv) Idv)

(declare-fun smt__STATE__SafeAt__ (Idv Idv) Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__CONSTANT__ProcSet__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__acceptor__ (Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

; hidden fact

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__ChosenIn__ (Idv Idv) Idv)

(declare-fun smt__STATE__chosen__ () Idv)

; hidden fact

(declare-fun smt__STATE__VInv1__ () Idv)

(declare-fun smt__STATE__VInv2__ () Idv)

(declare-fun smt__STATE__VInv3__ () Idv)

; hidden fact

(assert (= smt__STATE__TypeOK__ smt__TLA____Tt__Idv))

(assert (= smt__STATE__VInv1__ smt__TLA____Tt__Idv))

(assert (= smt__STATE__VInv2__ smt__TLA____Tt__Idv))

(declare-fun smt__CONSTANT__v__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__v__ smt__CONSTANT__Value__))

(declare-fun smt__CONSTANT__w__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__w__ smt__CONSTANT__Value__))

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__b__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__b__ smt__TLA____NatSet))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (forall ((smt__CONSTANT__c__ Idv))
    (=> (smt__TLA____Mem smt__CONSTANT__c__ smt__TLA____NatSet)
      (=>
        (and (smt__TLA____IntLteq smt__CONSTANT__c__ smt__CONSTANT__b__)
          (distinct smt__CONSTANT__c__ smt__CONSTANT__b__))
        (=>
          (= (smt__STATE__SafeAt__ smt__CONSTANT__b__ smt__CONSTANT__v__)
            smt__TLA____Tt__Idv)
          (=>
            (= (smt__STATE__ChosenIn__ smt__CONSTANT__c__ smt__CONSTANT__w__)
              smt__TLA____Tt__Idv) (= smt__CONSTANT__v__ smt__CONSTANT__w__)))))))

;; Goal
(assert
  (!
    (not
      (forall ((smt__CONSTANT__c__ Idv))
        (=> (smt__TLA____Mem smt__CONSTANT__c__ smt__TLA____NatSet)
          (=>
            (and
              (and
                (and
                  (smt__TLA____IntLteq smt__CONSTANT__c__ smt__CONSTANT__b__)
                  (distinct smt__CONSTANT__c__ smt__CONSTANT__b__))
                (=
                  (smt__STATE__SafeAt__ smt__CONSTANT__b__ smt__CONSTANT__v__)
                  smt__TLA____Tt__Idv))
              (=
                (smt__STATE__ChosenIn__ smt__CONSTANT__c__ smt__CONSTANT__w__)
                smt__TLA____Tt__Idv))
            (= smt__CONSTANT__v__ smt__CONSTANT__w__))))) :named |Goal|))

(check-sat)
(exit)
