(*---
description: >-
  Without SetMinusDef and SetExt, Z3 finds a model for the negation of x \in S \ T => x \notin T, so
  the proof rests on SetMinusDef.
ref: src/encode/n_axioms.ml#setminus_def
outcome: sat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_
;;	PROVE  CONSTANT_x_ \in CONSTANT_S_ \ CONSTANT_T_
;;	       => CONSTANT_x_ \notin CONSTANT_T_
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____SetMinus (Idv Idv) Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (smt__TLA____Mem smt__CONSTANT__x__
          (smt__TLA____SetMinus smt__CONSTANT__S__ smt__CONSTANT__T__))
        (not (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__T__))))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
