;; Proof obligation:
;;	ASSUME NEW VARIABLE VARIABLE_x_,
;;	       NEW VARIABLE VARIABLE_y_,
;;	       NEW VARIABLE VARIABLE_z_
;;	PROVE  (\E CONSTANT_r#0_ : VARIABLE_y_) /\ ?VARIABLE_x_#prime
;;	       <=> (\E CONSTANT_r#0_ : VARIABLE_y_) /\ ?VARIABLE_x_#prime
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #43
;; Generated from file "./Enabled_test.tla", line 261, characters 5-6

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Tt__Idv () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__VARIABLE__x__ () Idv)

(declare-fun smt__VARIABLE__x____prime () Idv)

(declare-fun smt__VARIABLE__y__ () Idv)

(declare-fun smt__VARIABLE__y____prime () Idv)

(declare-fun smt__VARIABLE__z__ () Idv)

(declare-fun smt__VARIABLE__z____prime () Idv)

(declare-fun smt__ACTION__P__ (Idv) Idv)

(declare-fun smt__STATE__Q__ () Idv)

(declare-fun smt__STATE__R__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__STATE__Yunprimed__ () Idv)

(declare-fun smt__STATE__F__ () Idv)

(declare-fun smt__STATE__G__ () Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__ACTION__A__ () Idv)

(declare-fun smt__STATE__B__ () Idv)

(declare-fun smt__STATE__BwithAexpanded__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__ACTION__C__ () Idv)

(declare-fun smt__STATE__D__ () Idv)

; hidden fact

; hidden fact

;; Goal
(assert
  (!
    (not
      (=
        (and
          (exists ((smt__CONSTANT__rpound__0__ Idv))
            (= smt__VARIABLE__y__ smt__TLA____Tt__Idv))
          (= smt__VARIABLE__x____prime smt__TLA____Tt__Idv))
        (and
          (exists ((smt__CONSTANT__rpound__0__ Idv))
            (= smt__VARIABLE__y__ smt__TLA____Tt__Idv))
          (= smt__VARIABLE__x____prime smt__TLA____Tt__Idv)))) :named |Goal|))

(check-sat)
(exit)
