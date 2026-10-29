;; Proof obligation:
;;	ASSUME NEW VARIABLE VARIABLE_c1_,
;;	       NEW VARIABLE VARIABLE_c2_,
;;	       NEW VARIABLE VARIABLE_turn_,
;;	       NEW VARIABLE VARIABLE_pc1_,
;;	       NEW VARIABLE VARIABLE_pc2_,
;;	       VARIABLE_pc1_ # 9
;;	       /\ (\/ /\ VARIABLE_pc1_ = 1
;;	              /\ ?VARIABLE_c1_#prime = 0
;;	              /\ ?VARIABLE_pc1_#prime = 2
;;	              /\ ?VARIABLE_turn_#prime = VARIABLE_turn_
;;	           \/ /\ VARIABLE_pc1_ = 2
;;	              /\ IF VARIABLE_c2_ = 0
;;	                   THEN ?VARIABLE_pc1_#prime = 3
;;	                   ELSE ?VARIABLE_pc1_#prime = 6
;;	              /\ /\ ?VARIABLE_c1_#prime = VARIABLE_c1_
;;	                 /\ ?VARIABLE_turn_#prime = VARIABLE_turn_
;;	           \/ /\ VARIABLE_pc1_ = 3
;;	              /\ IF VARIABLE_turn_ = 1
;;	                   THEN ?VARIABLE_pc1_#prime = 2
;;	                   ELSE ?VARIABLE_pc1_#prime = 4
;;	              /\ /\ ?VARIABLE_c1_#prime = VARIABLE_c1_
;;	                 /\ ?VARIABLE_turn_#prime = VARIABLE_turn_
;;	           \/ /\ VARIABLE_pc1_ = 4
;;	              /\ ?VARIABLE_c1_#prime = 1
;;	              /\ ?VARIABLE_pc1_#prime = 5
;;	              /\ ?VARIABLE_turn_#prime = VARIABLE_turn_
;;	           \/ /\ VARIABLE_pc1_ = 5
;;	              /\ IF VARIABLE_turn_ = 2
;;	                   THEN ?VARIABLE_pc1_#prime = 5
;;	                   ELSE ?VARIABLE_pc1_#prime = 1
;;	              /\ /\ ?VARIABLE_c1_#prime = VARIABLE_c1_
;;	                 /\ ?VARIABLE_turn_#prime = VARIABLE_turn_
;;	           \/ /\ VARIABLE_pc1_ = 6
;;	              /\ ?VARIABLE_pc1_#prime = 7
;;	              /\ /\ ?VARIABLE_c1_#prime = VARIABLE_c1_
;;	                 /\ ?VARIABLE_turn_#prime = VARIABLE_turn_
;;	           \/ /\ VARIABLE_pc1_ = 7
;;	              /\ ?VARIABLE_pc1_#prime = 8
;;	              /\ ?VARIABLE_turn_#prime = 2
;;	              /\ ?VARIABLE_c1_#prime = VARIABLE_c1_
;;	           \/ /\ VARIABLE_pc1_ = 8
;;	              /\ ?VARIABLE_pc1_#prime = 9
;;	              /\ ?VARIABLE_c1_#prime = 1
;;	              /\ ?VARIABLE_turn_#prime = VARIABLE_turn_
;;	           \/ /\ VARIABLE_pc1_ = 9
;;	              /\ ?VARIABLE_pc1_#prime = 1
;;	              /\ /\ ?VARIABLE_c1_#prime = VARIABLE_c1_
;;	                 /\ ?VARIABLE_turn_#prime = VARIABLE_turn_)
;;	       /\ ~(/\ ?VARIABLE_pc1_#prime = VARIABLE_pc1_
;;	            /\ ?VARIABLE_c1_#prime = VARIABLE_c1_
;;	            /\ ?VARIABLE_turn_#prime = VARIABLE_turn_) ,
;;	       VARIABLE_pc1_ = 4 
;;	PROVE  ?VARIABLE_pc1_#prime = 5
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #146
;; Generated from file "./Dekker.tla", line 536, characters 17-18

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

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

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__VARIABLE__c1__ () Idv)

(declare-fun smt__VARIABLE__c1____prime () Idv)

(declare-fun smt__VARIABLE__c2__ () Idv)

(declare-fun smt__VARIABLE__c2____prime () Idv)

(declare-fun smt__VARIABLE__turn__ () Idv)

(declare-fun smt__VARIABLE__turn____prime () Idv)

(declare-fun smt__VARIABLE__pc1__ () Idv)

(declare-fun smt__VARIABLE__pc1____prime () Idv)

(declare-fun smt__VARIABLE__pc2__ () Idv)

(declare-fun smt__VARIABLE__pc2____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__STATE__vars2__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__Next2__ () Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Sys__ () Idv)

(declare-fun smt__STATE__Inv__ () Idv)

(declare-fun smt__TEMPORAL__StFr1__ () Idv)

(declare-fun smt__TEMPORAL__StFr2__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__IndInv__ () Idv)

; hidden fact

(declare-fun smt__STATE__Enabledness__ () Idv)

; hidden fact

(declare-fun smt__STATE__LIndInv__ () Idv)

(declare-fun smt__TEMPORAL__LSys__ () Idv)

; hidden fact

(declare-fun smt__STATE__IndInv2__ () Idv)

(declare-fun smt__STATE__LInv__ () Idv)

(declare-fun smt__ACTION__Trans1__ () Idv)

(declare-fun smt__ACTION__Trans2__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

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
  (and
    (and (distinct smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 9))
      (or
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 1))
          (= smt__VARIABLE__c1____prime (smt__TLA____Cast__Int 0))
          (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 2))
          (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 2))
          (ite (= smt__VARIABLE__c2__ (smt__TLA____Cast__Int 0))
            (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 3))
            (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 6)))
          (and (= smt__VARIABLE__c1____prime smt__VARIABLE__c1__)
            (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__)))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 3))
          (ite (= smt__VARIABLE__turn__ (smt__TLA____Cast__Int 1))
            (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 2))
            (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 4)))
          (and (= smt__VARIABLE__c1____prime smt__VARIABLE__c1__)
            (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__)))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 4))
          (= smt__VARIABLE__c1____prime (smt__TLA____Cast__Int 1))
          (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 5))
          (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 5))
          (ite (= smt__VARIABLE__turn__ (smt__TLA____Cast__Int 2))
            (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 5))
            (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 1)))
          (and (= smt__VARIABLE__c1____prime smt__VARIABLE__c1__)
            (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__)))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 6))
          (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 7))
          (and (= smt__VARIABLE__c1____prime smt__VARIABLE__c1__)
            (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__)))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 7))
          (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 8))
          (= smt__VARIABLE__turn____prime (smt__TLA____Cast__Int 2))
          (= smt__VARIABLE__c1____prime smt__VARIABLE__c1__))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 8))
          (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 9))
          (= smt__VARIABLE__c1____prime (smt__TLA____Cast__Int 1))
          (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__))
        (and (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 9))
          (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 1))
          (and (= smt__VARIABLE__c1____prime smt__VARIABLE__c1__)
            (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__)))))
    (not
      (and (= smt__VARIABLE__pc1____prime smt__VARIABLE__pc1__)
        (= smt__VARIABLE__c1____prime smt__VARIABLE__c1__)
        (= smt__VARIABLE__turn____prime smt__VARIABLE__turn__)))))

(assert (= smt__VARIABLE__pc1__ (smt__TLA____Cast__Int 4)))

;; Goal
(assert
  (! (not (= smt__VARIABLE__pc1____prime (smt__TLA____Cast__Int 5)))
    :named |Goal|))

(check-sat)
(exit)
