(*---
description: 'Z3 finds a two-element model refuting (\E a : P(a)) => \A a : P(a).'
ref: src/backend/smtlib.ml#fmt_expr
outcome: sat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_P_(_)
;;	PROVE  (\E CONSTANT_a_ : CONSTANT_P_(CONSTANT_a_))
;;	       => (\A CONSTANT_a_ : CONSTANT_P_(CONSTANT_a_))
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

(declare-fun smt__CONSTANT__P__ (Idv) Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (exists ((smt__CONSTANT__a__ Idv))
          (= (smt__CONSTANT__P__ smt__CONSTANT__a__) smt__TLA____Tt__Idv))
        (forall ((smt__CONSTANT__a__ Idv))
          (= (smt__CONSTANT__P__ smt__CONSTANT__a__) smt__TLA____Tt__Idv))))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
