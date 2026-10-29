;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_F_(_),
;;	       NEW CONSTANT CONSTANT_a_,
;;	       ASSUME NEW CONSTANT CONSTANT_F__1(_),
;;	              NEW CONSTANT CONSTANT_a__1
;;	       PROVE  CONSTANT_F__1(CONSTANT_a__1) 
;;	PROVE  CONSTANT_F_(CONSTANT_a_)
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #2
;; Generated from file "./sndordthm_test.tla", line 15, characters 5-6

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Tt__Idv () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

; hidden fact

(declare-fun smt__CONSTANT__F__ (Idv) Idv)

(declare-fun smt__CONSTANT__a__ () Idv)

; omitted fact (second-order)

;; Goal
(assert
  (! (not (= (smt__CONSTANT__F__ smt__CONSTANT__a__) smt__TLA____Tt__Idv))
    :named |Goal|))

(check-sat)
(exit)
