(*---
description: Z3 proves CHOOSE picks a witness, through the ChooseDef axiom of the flattened CHOOSE symbol.
ref: src/encode/n_axioms.ml#choose_def
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_P_(_)
;;	PROVE  (\E CONSTANT_a_ \in CONSTANT_S_ : CONSTANT_P_(CONSTANT_a_))
;;	       => (CHOOSE CONSTANT_a_ \in CONSTANT_S_ : CONSTANT_P_(CONSTANT_a_))
;;	          \in CONSTANT_S_
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

; omitted declaration of 'TLA__Choose' (second-order)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

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

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__P__ (Idv) Idv)

(declare-fun smt__TLA____Choose__flatnd__1 () Idv)

;; Axiom: ChooseDef TLA__Choose_flatnd_1
(assert
  (!
    (forall ((smt__x Idv))
      (=>
        (and (smt__TLA____Mem smt__x smt__CONSTANT__S__)
          (= (smt__CONSTANT__P__ smt__x) smt__TLA____Tt__Idv))
        (and
          (smt__TLA____Mem smt__TLA____Choose__flatnd__1 smt__CONSTANT__S__)
          (= (smt__CONSTANT__P__ smt__TLA____Choose__flatnd__1)
            smt__TLA____Tt__Idv)))) :named |ChooseDef TLA__Choose_flatnd_1|))

;; Goal
(assert
  (!
    (not
      (=>
        (exists ((smt__CONSTANT__a__ Idv))
          (and (smt__TLA____Mem smt__CONSTANT__a__ smt__CONSTANT__S__)
            (= (smt__CONSTANT__P__ smt__CONSTANT__a__) smt__TLA____Tt__Idv)))
        (smt__TLA____Mem smt__TLA____Choose__flatnd__1 smt__CONSTANT__S__)))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
