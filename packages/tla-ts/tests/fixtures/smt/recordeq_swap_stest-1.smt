;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_
;;	PROVE  [foo |-> CONSTANT_x_, bar |-> CONSTANT_y_]
;;	       = [foo |-> CONSTANT_y_, bar |-> CONSTANT_x_]
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./recordeq_swap_stest.tla", line 16, characters 1-2

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__y__ () Idv)

;; Goal
(assert
  (!
    (not
      (and (= smt__CONSTANT__x__ smt__CONSTANT__y__)
        (= smt__CONSTANT__y__ smt__CONSTANT__x__))) :named |Goal|))

(check-sat)
(exit)
