;; Proof obligation:
;;	CONSTANT_C_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./hidedef_test.tla", line 9, characters 5-11

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Tt__Idv () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__C__ () Idv)

;; Goal
(assert (! (not (= smt__CONSTANT__C__ smt__TLA____Tt__Idv)) :named |Goal|))

(check-sat)
(exit)
