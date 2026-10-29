;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Client_,
;;	       NEW CONSTANT CONSTANT_Resource_,
;;	       NEW VARIABLE VARIABLE_unsat_,
;;	       NEW VARIABLE VARIABLE_alloc_,
;;	       NEW CONSTANT CONSTANT_clt_ \in CONSTANT_Client_,
;;	       NEW CONSTANT CONSTANT_S_ \in SUBSET CONSTANT_Resource_,
;;	       ASSUME NEW CONSTANT CONSTANT_c1_ \in CONSTANT_Client_,
;;	              NEW CONSTANT CONSTANT_c2_ \in CONSTANT_Client_,
;;	              NEW CONSTANT CONSTANT_r_ \in CONSTANT_Resource_,
;;	              CONSTANT_r_
;;	              \in ?VARIABLE_alloc_#prime[CONSTANT_c1_]
;;	                  \cap ?VARIABLE_alloc_#prime[CONSTANT_c2_] 
;;	       PROVE  CONSTANT_c1_ = CONSTANT_c2_ 
;;	PROVE  \A CONSTANT_c1_, CONSTANT_c2_ \in CONSTANT_Client_ :
;;	          \A CONSTANT_r_ \in CONSTANT_Resource_ :
;;	             CONSTANT_r_
;;	             \in ?VARIABLE_alloc_#prime[CONSTANT_c1_]
;;	                 \cap ?VARIABLE_alloc_#prime[CONSTANT_c2_]
;;	             => CONSTANT_c1_ = CONSTANT_c2_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #37
;; Generated from file "./Allocator.tla", line 221, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cap (Idv Idv) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetEnum__0 () Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____Subset (Idv) Idv)

(declare-fun smt__TLA____SubsetEq (Idv Idv) Bool)

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

;; Axiom: CapDef
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____Cap smt__a smt__b))
          (and (smt__TLA____Mem smt__x smt__a)
            (smt__TLA____Mem smt__x smt__b)))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____Cap smt__a smt__b)))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____Cap smt__a smt__b))
        :pattern ((smt__TLA____Mem smt__x smt__b)
                   (smt__TLA____Cap smt__a smt__b)))) :named |CapDef|))

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

;; Axiom: DisjointTrigger
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (!
        (smt__TLA____SetExtTrigger (smt__TLA____Cap smt__x smt__y)
          smt__TLA____SetEnum__0) :pattern ((smt__TLA____Cap smt__x smt__y))))
    :named |DisjointTrigger|))

;; Axiom: EnumDefElim 0
(assert
  (!
    (forall ((smt__x Idv))
      (! (not (smt__TLA____Mem smt__x smt__TLA____SetEnum__0))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____SetEnum__0))))
    :named |EnumDefElim 0|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__Client__ () Idv)

(declare-fun smt__CONSTANT__Resource__ () Idv)

(declare-fun smt__VARIABLE__unsat__ () Idv)

(declare-fun smt__VARIABLE__unsat____prime () Idv)

(declare-fun smt__VARIABLE__alloc__ () Idv)

(declare-fun smt__VARIABLE__alloc____prime () Idv)

(declare-fun smt__STATE__TypeInvariant__ () Idv)

(declare-fun smt__STATE__available__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__Request__ (Idv Idv) Idv)

(declare-fun smt__ACTION__Allocate__ (Idv Idv) Idv)

(declare-fun smt__ACTION__Return__ (Idv Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__TEMPORAL__SimpleAllocator__ () Idv)

(declare-fun smt__TEMPORAL__ClientsWillReturn__ () Idv)

(declare-fun smt__TEMPORAL__ClientsWillObtain__ () Idv)

(declare-fun smt__TEMPORAL__InfOftenSatisfied__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__clt__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__clt__ smt__CONSTANT__Client__))

(declare-fun smt__CONSTANT__S__ () Idv)

(assert
  (smt__TLA____Mem smt__CONSTANT__S__
    (smt__TLA____Subset smt__CONSTANT__Resource__)))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (forall ((smt__CONSTANT__c1__ Idv))
    (=> (smt__TLA____Mem smt__CONSTANT__c1__ smt__CONSTANT__Client__)
      (forall ((smt__CONSTANT__c2__ Idv))
        (=> (smt__TLA____Mem smt__CONSTANT__c2__ smt__CONSTANT__Client__)
          (forall ((smt__CONSTANT__r__ Idv))
            (=>
              (smt__TLA____Mem smt__CONSTANT__r__ smt__CONSTANT__Resource__)
              (=>
                (smt__TLA____Mem smt__CONSTANT__r__
                  (smt__TLA____Cap
                    (smt__TLA____FunApp smt__VARIABLE__alloc____prime
                      smt__CONSTANT__c1__)
                    (smt__TLA____FunApp smt__VARIABLE__alloc____prime
                      smt__CONSTANT__c2__)))
                (= smt__CONSTANT__c1__ smt__CONSTANT__c2__)))))))))

;; Goal
(assert
  (!
    (not
      (forall ((smt__CONSTANT__c1__ Idv) (smt__CONSTANT__c2__ Idv))
        (=>
          (and (smt__TLA____Mem smt__CONSTANT__c1__ smt__CONSTANT__Client__)
            (smt__TLA____Mem smt__CONSTANT__c2__ smt__CONSTANT__Client__))
          (forall ((smt__CONSTANT__r__ Idv))
            (=>
              (smt__TLA____Mem smt__CONSTANT__r__ smt__CONSTANT__Resource__)
              (=>
                (smt__TLA____Mem smt__CONSTANT__r__
                  (smt__TLA____Cap
                    (smt__TLA____FunApp smt__VARIABLE__alloc____prime
                      smt__CONSTANT__c1__)
                    (smt__TLA____FunApp smt__VARIABLE__alloc____prime
                      smt__CONSTANT__c2__)))
                (= smt__CONSTANT__c1__ smt__CONSTANT__c2__)))))))
    :named |Goal|))

(check-sat)
(exit)
