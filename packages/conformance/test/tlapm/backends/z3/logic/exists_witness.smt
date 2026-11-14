(*---
description: Z3 proves a bounded existential from a witness.
ref: src/encode/n_rewrite.ml#elim_bounds
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_x_
;;	PROVE  CONSTANT_x_ \in CONSTANT_S_
;;	       => (\E CONSTANT_a_ \in CONSTANT_S_ : CONSTANT_a_ = CONSTANT_x_)
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

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

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__x__ () Idv)

;; Goal
(assert
  (!
    (not
      (=> (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__S__)
        (exists ((smt__CONSTANT__a__ Idv))
          (and (smt__TLA____Mem smt__CONSTANT__a__ smt__CONSTANT__S__)
            (= smt__CONSTANT__a__ smt__CONSTANT__x__))))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
