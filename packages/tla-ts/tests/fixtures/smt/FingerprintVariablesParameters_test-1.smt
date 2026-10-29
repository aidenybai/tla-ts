;; Proof obligation:
;;	ASSUME NEW VARIABLE VARIABLE_x_
;;	PROVE  \E CONSTANT_y_ : CONSTANT_y_ # VARIABLE_x_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./FingerprintVariablesParameters_test.tla", line 16, characters 1-7

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__VARIABLE__x__ () Idv)

(declare-fun smt__VARIABLE__x____prime () Idv)

;; Goal
(assert
  (!
    (not
      (exists ((smt__CONSTANT__y__ Idv))
        (distinct smt__CONSTANT__y__ smt__VARIABLE__x__))) :named |Goal|))

(check-sat)
(exit)
