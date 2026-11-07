(*---
description: Z3 proves x = y => F(x) = F(y) for a declared operator F, an uninterpreted function on Idv.
ref: src/backend/smtlib.ml#pp_print_obligation
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_,
;;	       NEW CONSTANT CONSTANT_F_(_)
;;	PROVE  CONSTANT_x_ = CONSTANT_y_
;;	       => CONSTANT_F_(CONSTANT_x_) = CONSTANT_F_(CONSTANT_y_)
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__y__ () Idv)

(declare-fun smt__CONSTANT__F__ (Idv) Idv)

;; Goal
(assert
  (!
    (not
      (=> (= smt__CONSTANT__x__ smt__CONSTANT__y__)
        (= (smt__CONSTANT__F__ smt__CONSTANT__x__)
          (smt__CONSTANT__F__ smt__CONSTANT__y__)))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
