;; Proof obligation:
;;	FALSE
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./nonexistent_test.tla", line 13, characters 1-7

(set-logic UFNIA)

;; Sorts


;; Hypotheses


;; Goal
(assert (! (not false) :named |Goal|))

(check-sat)
(exit)
