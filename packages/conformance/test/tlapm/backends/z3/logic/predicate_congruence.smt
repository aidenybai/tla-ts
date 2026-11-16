(*---
description: Z3 proves P(x) /\ x = y => P(y) for an operator used as a predicate.
ref: src/backend/smtlib.ml#pp_print_obligation
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_,
;;	       NEW CONSTANT CONSTANT_P_(_)
;;	PROVE  CONSTANT_P_(CONSTANT_x_) /\ CONSTANT_x_ = CONSTANT_y_
;;	       => CONSTANT_P_(CONSTANT_y_)
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

(declare-fun smt__CONSTANT__y__ () Idv)

(declare-fun smt__CONSTANT__P__ (Idv) Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (and (= (smt__CONSTANT__P__ smt__CONSTANT__x__) smt__TLA____Tt__Idv)
          (= smt__CONSTANT__x__ smt__CONSTANT__y__))
        (= (smt__CONSTANT__P__ smt__CONSTANT__y__) smt__TLA____Tt__Idv)))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
