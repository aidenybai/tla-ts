;; Proof obligation:
;;	ASSUME NEW VARIABLE VARIABLE_x_
;;	PROVE  ?h889c5
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #5
;; Generated from file "./test213.tla", line 21, characters 10-17

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__h889c5 () Idv)

(declare-fun smt__TLA____Tt__Idv () Idv)

(declare-fun smt__VARIABLE__x__ () Idv)

(declare-fun smt__VARIABLE__x____prime () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

;; Goal
(assert
  (! (not (= smt__TLA____Anon__OPAQUE__h889c5 smt__TLA____Tt__Idv))
    :named |Goal|))

(check-sat)
(exit)
