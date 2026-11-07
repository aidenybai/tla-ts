(*---
description: Z3 finds a model for the negation of x = y, satisfying SetExt with two distinct individuals.
ref: src/encode/n_axioms.ml#set_ext
outcome: sat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_
;;	PROVE  CONSTANT_x_ = CONSTANT_y_
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

;; Goal
(assert (! (not (= smt__CONSTANT__x__ smt__CONSTANT__y__)) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
