(*---
description: Z3 finds a model in which two predicates differ.
ref: src/backend/smtlib.ml#pp_print_obligation
outcome: sat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_P_(_),
;;	       NEW CONSTANT CONSTANT_Q_(_)
;;	PROVE  CONSTANT_P_(CONSTANT_x_) => CONSTANT_Q_(CONSTANT_x_)
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Tt__Idv () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__P__ (Idv) Idv)

(declare-fun smt__CONSTANT__Q__ (Idv) Idv)

;; Goal
(assert
  (!
    (not
      (=> (= (smt__CONSTANT__P__ smt__CONSTANT__x__) smt__TLA____Tt__Idv)
        (= (smt__CONSTANT__Q__ smt__CONSTANT__x__) smt__TLA____Tt__Idv)))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
