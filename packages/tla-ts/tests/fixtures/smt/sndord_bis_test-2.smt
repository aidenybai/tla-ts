;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_F1_(_),
;;	       NEW CONSTANT CONSTANT_F2_(_),
;;	       ASSUME NEW CONSTANT CONSTANT_F_(_)
;;	       PROVE  CONSTANT_G_(CONSTANT_F_) = CONSTANT_F_(CONSTANT_C_) 
;;	PROVE  CONSTANT_G_(CONSTANT_F1_) = CONSTANT_G_(CONSTANT_F2_)
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #2
;; Generated from file "./sndord_bis_test.tla", line 20, characters 5-6

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__C__ () Idv)

; omitted declaration of 'CONSTANT_G_' (second-order)

; hidden fact

(declare-fun smt__CONSTANT__F1__ (Idv) Idv)

(declare-fun smt__CONSTANT__F2__ (Idv) Idv)

; omitted fact (second-order)

(declare-fun smt__CONSTANT__G____flatnd__1 () Idv)

(declare-fun smt__CONSTANT__G____flatnd__2 () Idv)

;; Goal
(assert
  (! (not (= smt__CONSTANT__G____flatnd__1 smt__CONSTANT__G____flatnd__2))
    :named |Goal|))

(check-sat)
(exit)
