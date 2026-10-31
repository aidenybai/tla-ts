;; Proof obligation:
;;	ASSUME NEW VARIABLE VARIABLE_x_
;;	PROVE  \E CONSTANT_r#0_, CONSTANT_r#1_ : CONSTANT_r#1_ # CONSTANT_r#0_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./ENABLED_INSTANCE_op_with_args_test.tla", line 16, characters 1-2

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__VARIABLE__x__ () Idv)

(declare-fun smt__VARIABLE__x____prime () Idv)

;; Goal
(assert
  (!
    (not
      (exists
        ((smt__CONSTANT__rpound__0__ Idv) (smt__CONSTANT__rpound__1__ Idv))
        (distinct smt__CONSTANT__rpound__1__ smt__CONSTANT__rpound__0__)))
    :named |Goal|))

(check-sat)
(exit)
