(*---
description: >-
  Z3 proves two record constructors with the fields in different orders are equal; tlapm sorts the
  fields.
ref: src/encode/n_rewrite.ml#sort_recfields
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_
;;	PROVE  [a |-> CONSTANT_x_, b |-> CONSTANT_y_]
;;	       = [b |-> CONSTANT_y_, a |-> CONSTANT_x_]
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
(assert
  (!
    (not
      (and (= smt__CONSTANT__x__ smt__CONSTANT__x__)
        (= smt__CONSTANT__y__ smt__CONSTANT__y__))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
