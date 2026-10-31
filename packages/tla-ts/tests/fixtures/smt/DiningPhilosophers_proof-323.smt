;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_N_,
;;	       NEW VARIABLE VARIABLE_philosophers_,
;;	       NEW VARIABLE VARIABLE_forks_,
;;	       NEW CONSTANT CONSTANT_q_ \in CONSTANT_P_,
;;	       STATE_Inv_ ,
;;	       STATE_Idle_(CONSTANT_q_) ,
;;	       ACTION_Next_ \/ ?h6fbaa = STATE_vars_ ,
;;	       ACTION_Act_(CONSTANT_q_) /\ ~?h6fbaa = STATE_vars_ ,
;;	       ASSUME STATE_Inv_ ,
;;	              NEW CONSTANT CONSTANT_q__1 \in CONSTANT_P_,
;;	              STATE_Idle_(CONSTANT_q__1) ,
;;	              ACTION_Act_(CONSTANT_q__1) /\ ~?h6fbaa = STATE_vars_ 
;;	       PROVE  ?hc7c4d(CONSTANT_q__1) 
;;	PROVE  ?h48d51(CONSTANT_q_) \/ ?hc7c4d(CONSTANT_q_)
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #323
;; Generated from file "./DiningPhilosophers_proof.tla", line 440, characters 5-6

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__h6fbaa () Idv)

(declare-fun smt__TLA____Anon__h48d51 (Idv) Idv)

(declare-fun smt__TLA____Anon__hc7c4d (Idv) Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

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

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

(declare-fun smt__CONSTANT__N__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__P__ () Idv)

(declare-fun smt__CONSTANT__LeftFork__ (Idv) Idv)

(declare-fun smt__CONSTANT__RightFork__ (Idv) Idv)

; hidden fact

; hidden fact

(declare-fun smt__VARIABLE__philosophers__ () Idv)

(declare-fun smt__VARIABLE__philosophers____prime () Idv)

(declare-fun smt__VARIABLE__forks__ () Idv)

(declare-fun smt__VARIABLE__forks____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__TakeLeft__ (Idv) Idv)

(declare-fun smt__ACTION__TakeRight__ (Idv) Idv)

(declare-fun smt__ACTION__Release__ (Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__IsEating__ (Idv) Idv)

(declare-fun smt__STATE__NoDeadlock__ () Idv)

(declare-fun smt__TEMPORAL__NoLivelock__ () Idv)

(declare-fun smt__TEMPORAL__NoStarvation__ () Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__STATE__Alias__ () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

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

(declare-fun smt__CONSTANT__LowFork__ (Idv) Idv)

(declare-fun smt__CONSTANT__HighFork__ (Idv) Idv)

(declare-fun smt__CONSTANT__Rank__ (Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Pred__ (Idv) Idv)

; hidden fact

; hidden fact

(declare-fun smt__STATE__Idle__ (Idv) Idv)

(declare-fun smt__STATE__Hungry__ (Idv) Idv)

(declare-fun smt__STATE__Eating__ (Idv) Idv)

(declare-fun smt__STATE__Phases__ () Idv)

(declare-fun smt__STATE__OnTable__ () Idv)

(declare-fun smt__STATE__Exclusive__ () Idv)

(declare-fun smt__STATE__Inv__ () Idv)

(declare-fun smt__ACTION__TakeLow__ (Idv) Idv)

(declare-fun smt__ACTION__TakeHigh__ (Idv) Idv)

(declare-fun smt__ACTION__NextLH__ () Idv)

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

(declare-fun smt__ACTION__Act__ (Idv) Idv)

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

(declare-fun smt__TEMPORAL__FreeIO__ (Idv) Idv)

(declare-fun smt__STATE__HeldEat__ (Idv Idv) Idv)

(declare-fun smt__TEMPORAL__IdleToHungry__ (Idv) Idv)

(declare-fun smt__TEMPORAL__HungryToEating__ (Idv) Idv)

(declare-fun smt__TEMPORAL__EatingFrees__ (Idv Idv) Idv)

(declare-fun smt__TEMPORAL__HungryFrees__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__q__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__q__ smt__CONSTANT__P__))

; hidden fact

; hidden fact

(assert (= smt__STATE__Inv__ smt__TLA____Tt__Idv))

(assert (= (smt__STATE__Idle__ smt__CONSTANT__q__) smt__TLA____Tt__Idv))

(assert
  (or (= smt__ACTION__Next__ smt__TLA____Tt__Idv)
    (= smt__TLA____Anon__OPAQUE__h6fbaa smt__STATE__vars__)))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (and (= (smt__ACTION__Act__ smt__CONSTANT__q__) smt__TLA____Tt__Idv)
    (not (= smt__TLA____Anon__OPAQUE__h6fbaa smt__STATE__vars__))))

(assert
  (=> (= smt__STATE__Inv__ smt__TLA____Tt__Idv)
    (forall ((smt__CONSTANT__q___1 Idv))
      (=> (smt__TLA____Mem smt__CONSTANT__q___1 smt__CONSTANT__P__)
        (=> (= (smt__STATE__Idle__ smt__CONSTANT__q___1) smt__TLA____Tt__Idv)
          (=>
            (and
              (= (smt__ACTION__Act__ smt__CONSTANT__q___1)
                smt__TLA____Tt__Idv)
              (not (= smt__TLA____Anon__OPAQUE__h6fbaa smt__STATE__vars__)))
            (= (smt__TLA____Anon__hc7c4d smt__CONSTANT__q___1)
              smt__TLA____Tt__Idv)))))))

;; Goal
(assert
  (!
    (not
      (or
        (= (smt__TLA____Anon__h48d51 smt__CONSTANT__q__) smt__TLA____Tt__Idv)
        (= (smt__TLA____Anon__hc7c4d smt__CONSTANT__q__) smt__TLA____Tt__Idv)))
    :named |Goal|))

(check-sat)
(exit)
