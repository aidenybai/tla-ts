(*---
description: Z3 proves TRUE \in BOOLEAN through TypeGuardIntro Bool on the Cast_Bool of true.
ref: src/encode/n_axioms.ml#type_guard_intro
outcome: unsat
---*)
;; Proof obligation:
;;	TRUE \in BOOLEAN
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____BoolSet () Idv)

(declare-fun smt__TLA____Cast__Bool (Bool) Idv)

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

;; Axiom: CastInjAlt Bool
(assert
  (!
    (and (= (smt__TLA____Cast__Bool true) smt__TLA____Tt__Idv)
      (distinct (smt__TLA____Cast__Bool false) smt__TLA____Tt__Idv))
    :named |CastInjAlt Bool|))

;; Axiom: TypeGuardIntro Bool
(assert
  (!
    (forall ((smt__z Bool))
      (!
        (smt__TLA____Mem (smt__TLA____Cast__Bool smt__z) smt__TLA____BoolSet)
        :pattern ((smt__TLA____Cast__Bool smt__z))))
    :named |TypeGuardIntro Bool|))

;; Axiom: TypeGuardElim Bool
(assert
  (!
    (forall ((smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x smt__TLA____BoolSet)
          (or (= smt__x (smt__TLA____Cast__Bool true))
            (= smt__x (smt__TLA____Cast__Bool false))))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____BoolSet))))
    :named |TypeGuardElim Bool|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

;; Goal
(assert
  (!
    (not (smt__TLA____Mem (smt__TLA____Cast__Bool true) smt__TLA____BoolSet))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
