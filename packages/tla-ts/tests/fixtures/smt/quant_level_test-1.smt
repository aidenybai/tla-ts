;; Proof obligation:
;;	ASSUME NEW VARIABLE VARIABLE_v_,
;;	       STATE_I_ 
;;	PROVE  ?hb9f01
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./quant_level_test.tla", line 9, characters 25-31

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__hb9f01 () Idv)

(declare-fun smt__TLA____Tt__Idv () Idv)

(declare-fun smt__VARIABLE__v__ () Idv)

(declare-fun smt__VARIABLE__v____prime () Idv)

(declare-fun smt__STATE__I__ () Idv)

(assert (= smt__STATE__I__ smt__TLA____Tt__Idv))

;; Goal
(assert
  (! (not (= smt__TLA____Anon__OPAQUE__hb9f01 smt__TLA____Tt__Idv))
    :named |Goal|))

(check-sat)
(exit)
