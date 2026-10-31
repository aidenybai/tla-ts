;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_DNA_,
;;	       NEW CONSTANT CONSTANT_PRIMER_,
;;	       NEW VARIABLE VARIABLE_tee_,
;;	       NEW VARIABLE VARIABLE_primer_,
;;	       NEW VARIABLE VARIABLE_dna_,
;;	       NEW VARIABLE VARIABLE_template_,
;;	       NEW VARIABLE VARIABLE_hybrid_,
;;	       /\ VARIABLE_tee_ \in {"Warm", "Hot", "TooHot"}
;;	       /\ VARIABLE_primer_ \in Nat
;;	       /\ VARIABLE_dna_ \in Nat
;;	       /\ VARIABLE_template_ \in Nat
;;	       /\ VARIABLE_hybrid_ \in Nat ,
;;	       ACTION_Next_ \/ ?h6fbaa = STATE_vars_ ,
;;	       NEW CONSTANT CONSTANT_k_ \in 1..CONSTANT_natMin_(VARIABLE_primer_,
;;	                                                        VARIABLE_template_),
;;	       ?VARIABLE_primer_#prime = VARIABLE_primer_ - CONSTANT_k_ ,
;;	       ?VARIABLE_template_#prime = VARIABLE_template_ - CONSTANT_k_ ,
;;	       ?VARIABLE_hybrid_#prime = VARIABLE_hybrid_ + CONSTANT_k_ ,
;;	       CONSTANT_k_ \in Nat ,
;;	       CONSTANT_k_ =< VARIABLE_primer_ /\ CONSTANT_k_ =< VARIABLE_template_ 
;;	PROVE  ?VARIABLE_primer_#prime \in Nat /\ ?VARIABLE_template_#prime \in Nat
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #39
;; Generated from file "./clean_proof.tla", line 52, characters 7-8

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__h6fbaa () Idv)

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntMinus (Idv Idv) Idv)

(declare-fun smt__TLA____IntPlus (Idv Idv) Idv)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetEnum__3 (Idv Idv Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__Hot () Idv)

(declare-fun smt__TLA____StrLit__TooHot () Idv)

(declare-fun smt__TLA____StrLit__Warm () Idv)

(declare-fun smt__TLA____StrSet () Idv)

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

;; Axiom: EnumDefIntro 3
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv) (smt__a3 Idv))
      (!
        (and
          (smt__TLA____Mem smt__a1
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))
          (smt__TLA____Mem smt__a2
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))
          (smt__TLA____Mem smt__a3
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3)))
        :pattern ((smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))))
    :named |EnumDefIntro 3|))

;; Axiom: EnumDefElim 3
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv) (smt__a3 Idv) (smt__x Idv))
      (!
        (=>
          (smt__TLA____Mem smt__x
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))
          (or (= smt__x smt__a1) (= smt__x smt__a2) (= smt__x smt__a3)))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3)))))
    :named |EnumDefElim 3|))

;; Axiom: StrLitIsstr Hot
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__Hot smt__TLA____StrSet)
    :named |StrLitIsstr Hot|))

;; Axiom: StrLitIsstr TooHot
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__TooHot smt__TLA____StrSet)
    :named |StrLitIsstr TooHot|))

;; Axiom: StrLitIsstr Warm
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__Warm smt__TLA____StrSet)
    :named |StrLitIsstr Warm|))

;; Axiom: StrLitDistinct Hot Warm
(assert
  (! (distinct smt__TLA____StrLit__Hot smt__TLA____StrLit__Warm)
    :named |StrLitDistinct Hot Warm|))

;; Axiom: StrLitDistinct TooHot Hot
(assert
  (! (distinct smt__TLA____StrLit__TooHot smt__TLA____StrLit__Hot)
    :named |StrLitDistinct TooHot Hot|))

;; Axiom: StrLitDistinct TooHot Warm
(assert
  (! (distinct smt__TLA____StrLit__TooHot smt__TLA____StrLit__Warm)
    :named |StrLitDistinct TooHot Warm|))

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

(declare-fun smt__CONSTANT__DNA__ () Idv)

(declare-fun smt__CONSTANT__PRIMER__ () Idv)

(declare-fun smt__VARIABLE__tee__ () Idv)

(declare-fun smt__VARIABLE__tee____prime () Idv)

(declare-fun smt__VARIABLE__primer__ () Idv)

(declare-fun smt__VARIABLE__primer____prime () Idv)

(declare-fun smt__VARIABLE__dna__ () Idv)

(declare-fun smt__VARIABLE__dna____prime () Idv)

(declare-fun smt__VARIABLE__template__ () Idv)

(declare-fun smt__VARIABLE__template____prime () Idv)

(declare-fun smt__VARIABLE__hybrid__ () Idv)

(declare-fun smt__VARIABLE__hybrid____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__CONSTANT__natMin__ (Idv Idv) Idv)

(declare-fun smt__ACTION__heat__ () Idv)

(declare-fun smt__ACTION__cool__ () Idv)

(declare-fun smt__ACTION__anneal__ () Idv)

(declare-fun smt__ACTION__extend__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__primerPositive__ () Idv)

(declare-fun smt__STATE__preservationInvariant__ () Idv)

(declare-fun smt__STATE__constantCount__ () Idv)

(declare-fun smt__TEMPORAL__preservationProperty__ () Idv)

(declare-fun smt__STATE__primerDepleted__ () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (and
    (smt__TLA____Mem smt__VARIABLE__tee__
      (smt__TLA____SetEnum__3 smt__TLA____StrLit__Warm
        smt__TLA____StrLit__Hot smt__TLA____StrLit__TooHot))
    (smt__TLA____Mem smt__VARIABLE__primer__ smt__TLA____NatSet)
    (smt__TLA____Mem smt__VARIABLE__dna__ smt__TLA____NatSet)
    (smt__TLA____Mem smt__VARIABLE__template__ smt__TLA____NatSet)
    (smt__TLA____Mem smt__VARIABLE__hybrid__ smt__TLA____NatSet)))

(assert
  (or (= smt__ACTION__Next__ smt__TLA____Tt__Idv)
    (= smt__TLA____Anon__OPAQUE__h6fbaa smt__STATE__vars__)))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__k__ () Idv)

(assert
  (smt__TLA____Mem smt__CONSTANT__k__
    (smt__TLA____IntRange (smt__TLA____Cast__Int 1)
      (smt__CONSTANT__natMin__ smt__VARIABLE__primer__
        smt__VARIABLE__template__))))

(assert
  (= smt__VARIABLE__primer____prime
    (smt__TLA____IntMinus smt__VARIABLE__primer__ smt__CONSTANT__k__)))

(assert
  (= smt__VARIABLE__template____prime
    (smt__TLA____IntMinus smt__VARIABLE__template__ smt__CONSTANT__k__)))

(assert
  (= smt__VARIABLE__hybrid____prime
    (smt__TLA____IntPlus smt__VARIABLE__hybrid__ smt__CONSTANT__k__)))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert (smt__TLA____Mem smt__CONSTANT__k__ smt__TLA____NatSet))

(assert
  (and (smt__TLA____IntLteq smt__CONSTANT__k__ smt__VARIABLE__primer__)
    (smt__TLA____IntLteq smt__CONSTANT__k__ smt__VARIABLE__template__)))

;; Goal
(assert
  (!
    (not
      (and
        (smt__TLA____Mem smt__VARIABLE__primer____prime smt__TLA____NatSet)
        (smt__TLA____Mem smt__VARIABLE__template____prime smt__TLA____NatSet)))
    :named |Goal|))

(check-sat)
(exit)
