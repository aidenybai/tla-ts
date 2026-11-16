(*---
description: >-
  Z3 proves record equality from equal fields, which tlapm decomposes field by field before
  encoding.
ref: src/encode/n_rewrite.ml#simpl_receq
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_,
;;	       NEW CONSTANT CONSTANT_z_,
;;	       NEW CONSTANT CONSTANT_w_
;;	PROVE  CONSTANT_x_ = CONSTANT_z_ /\ CONSTANT_y_ = CONSTANT_w_
;;	       => [a |-> CONSTANT_x_, b |-> CONSTANT_y_]
;;	          = [a |-> CONSTANT_z_, b |-> CONSTANT_w_]
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

(declare-fun smt__CONSTANT__z__ () Idv)

(declare-fun smt__CONSTANT__w__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (and (= smt__CONSTANT__x__ smt__CONSTANT__z__)
          (= smt__CONSTANT__y__ smt__CONSTANT__w__))
        (and (= smt__CONSTANT__x__ smt__CONSTANT__z__)
          (= smt__CONSTANT__y__ smt__CONSTANT__w__)))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
