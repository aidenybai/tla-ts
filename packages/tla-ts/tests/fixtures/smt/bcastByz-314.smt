;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_N_,
;;	       NEW CONSTANT CONSTANT_T_,
;;	       NEW CONSTANT CONSTANT_F_,
;;	       NEW VARIABLE VARIABLE_Corr_,
;;	       NEW VARIABLE VARIABLE_Faulty_,
;;	       NEW VARIABLE VARIABLE_pc_,
;;	       NEW VARIABLE VARIABLE_rcvd_,
;;	       NEW VARIABLE VARIABLE_sent_,
;;	       STATE_FCConstraints_ ,
;;	       STATE_TypeOK_ ,
;;	       ACTION_Next_
;;	       \/ (/\ ?VARIABLE_pc_#prime = VARIABLE_pc_
;;	           /\ ?VARIABLE_rcvd_#prime = VARIABLE_rcvd_
;;	           /\ ?VARIABLE_sent_#prime = VARIABLE_sent_
;;	           /\ ?VARIABLE_Corr_#prime = VARIABLE_Corr_
;;	           /\ ?VARIABLE_Faulty_#prime = VARIABLE_Faulty_) ,
;;	       ?VARIABLE_pc_#prime = VARIABLE_pc_ ,
;;	       ?VARIABLE_rcvd_#prime = VARIABLE_rcvd_ ,
;;	       ?VARIABLE_sent_#prime = VARIABLE_sent_ ,
;;	       ?VARIABLE_Corr_#prime = VARIABLE_Corr_ ,
;;	       ?VARIABLE_Faulty_#prime = VARIABLE_Faulty_ 
;;	PROVE  ?VARIABLE_Faulty_#prime = VARIABLE_Faulty_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #314
;; Generated from file "./bcastByz.tla", line 594, characters 7-8

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Tt__Idv () Idv)

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

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__N__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

(declare-fun smt__CONSTANT__F__ () Idv)

(declare-fun smt__VARIABLE__Corr__ () Idv)

(declare-fun smt__VARIABLE__Corr____prime () Idv)

(declare-fun smt__VARIABLE__Faulty__ () Idv)

(declare-fun smt__VARIABLE__Faulty____prime () Idv)

(declare-fun smt__VARIABLE__pc__ () Idv)

(declare-fun smt__VARIABLE__pc____prime () Idv)

(declare-fun smt__VARIABLE__rcvd__ () Idv)

(declare-fun smt__VARIABLE__rcvd____prime () Idv)

(declare-fun smt__VARIABLE__sent__ () Idv)

(declare-fun smt__VARIABLE__sent____prime () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Proc__ () Idv)

(declare-fun smt__CONSTANT__M__ () Idv)

(declare-fun smt__STATE__ByzMsgs__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__STATE__InitNoBcast__ () Idv)

(declare-fun smt__ACTION__Receive__ (Idv Idv) Idv)

(declare-fun smt__ACTION__ReceiveFromCorrectSender__ (Idv) Idv)

(declare-fun smt__ACTION__ReceiveFromAnySender__ (Idv) Idv)

(declare-fun smt__ACTION__UponV1__ (Idv) Idv)

(declare-fun smt__ACTION__UponNonFaulty__ (Idv) Idv)

(declare-fun smt__ACTION__UponAcceptNotSentBefore__ (Idv) Idv)

(declare-fun smt__ACTION__UponAcceptSentBefore__ (Idv) Idv)

(declare-fun smt__ACTION__Step__ (Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__TEMPORAL__SpecNoBcast__ () Idv)

(declare-fun smt__STATE__TypeOK__ () Idv)

(declare-fun smt__STATE__FCConstraints__ () Idv)

(declare-fun smt__TEMPORAL__CorrLtl__ () Idv)

(declare-fun smt__TEMPORAL__RelayLtl__ () Idv)

(declare-fun smt__TEMPORAL__UnforgLtl__ () Idv)

(declare-fun smt__STATE__Unforg__ () Idv)

(declare-fun smt__STATE__IndInv__Unforg__NoBcast__ () Idv)

(declare-fun smt__STATE__IndInv__Unforg__NoBcast__TLC__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert (= smt__STATE__FCConstraints__ smt__TLA____Tt__Idv))

(assert (= smt__STATE__TypeOK__ smt__TLA____Tt__Idv))

(assert
  (or (= smt__ACTION__Next__ smt__TLA____Tt__Idv)
    (and (= smt__VARIABLE__pc____prime smt__VARIABLE__pc__)
      (= smt__VARIABLE__rcvd____prime smt__VARIABLE__rcvd__)
      (= smt__VARIABLE__sent____prime smt__VARIABLE__sent__)
      (= smt__VARIABLE__Corr____prime smt__VARIABLE__Corr__)
      (= smt__VARIABLE__Faulty____prime smt__VARIABLE__Faulty__))))

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

(assert (= smt__VARIABLE__pc____prime smt__VARIABLE__pc__))

(assert (= smt__VARIABLE__rcvd____prime smt__VARIABLE__rcvd__))

(assert (= smt__VARIABLE__sent____prime smt__VARIABLE__sent__))

(assert (= smt__VARIABLE__Corr____prime smt__VARIABLE__Corr__))

(assert (= smt__VARIABLE__Faulty____prime smt__VARIABLE__Faulty__))

;; Goal
(assert
  (! (not (= smt__VARIABLE__Faulty____prime smt__VARIABLE__Faulty__))
    :named |Goal|))

(check-sat)
(exit)
