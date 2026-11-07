(*---
description: 'Z3 proves \E a : \A b : R(a, b) implies \A b : \E a : R(a, b), nested quantifiers.'
ref: src/backend/smtlib.ml#fmt_expr
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_R_(_, _)
;;	PROVE  (\E CONSTANT_a_ :
;;	           \A CONSTANT_b_ : CONSTANT_R_(CONSTANT_a_, CONSTANT_b_))
;;	       => (\A CONSTANT_b_ :
;;	              \E CONSTANT_a_ : CONSTANT_R_(CONSTANT_a_, CONSTANT_b_))
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Tt__Idv () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__R__ (Idv Idv) Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (exists ((smt__CONSTANT__a__ Idv))
          (forall ((smt__CONSTANT__b__ Idv))
            (= (smt__CONSTANT__R__ smt__CONSTANT__a__ smt__CONSTANT__b__)
              smt__TLA____Tt__Idv)))
        (forall ((smt__CONSTANT__b__ Idv))
          (exists ((smt__CONSTANT__a__ Idv))
            (= (smt__CONSTANT__R__ smt__CONSTANT__a__ smt__CONSTANT__b__)
              smt__TLA____Tt__Idv))))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
