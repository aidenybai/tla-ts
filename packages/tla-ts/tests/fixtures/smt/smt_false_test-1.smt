;; Proof obligation:
;;	FALSE
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./smt_false_test.tla", line 5, characters 20-21

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

;; Goal
(assert (! (not false) :named |Goal|))

(check-sat)
(exit)
