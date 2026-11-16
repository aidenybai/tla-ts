(*---
description: Z3 proves two CHOOSE expressions with the same body are equal; flattening gives them one symbol.
ref: src/encode/n_flatten.ml
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_x_
;;	PROVE  (CHOOSE CONSTANT_a_ \in CONSTANT_S_ : CONSTANT_a_ = CONSTANT_x_)
;;	       = (CHOOSE CONSTANT_b_ \in CONSTANT_S_ : CONSTANT_b_ = CONSTANT_x_)
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

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__TLA____Choose__flatnd__1 () Idv)

;; Axiom: ChooseDef TLA__Choose_flatnd_1
(assert
  (!
    (forall ((smt__x Idv))
      (=>
        (and (smt__TLA____Mem smt__x smt__CONSTANT__S__)
          (= smt__x smt__CONSTANT__x__))
        (and
          (smt__TLA____Mem smt__TLA____Choose__flatnd__1 smt__CONSTANT__S__)
          (= smt__TLA____Choose__flatnd__1 smt__CONSTANT__x__))))
    :named |ChooseDef TLA__Choose_flatnd_1|))

;; Goal
(assert
  (! (not (= smt__TLA____Choose__flatnd__1 smt__TLA____Choose__flatnd__1))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
