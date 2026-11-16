(*---
description: Z3 proves "abc" \in STRING through StrLitIsstr.
ref: src/encode/n_axioms.ml#strlit_isstr
outcome: unsat
---*)
;; Proof obligation:
;;	"abc" \in STRING
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__abc () Idv)

(declare-fun smt__TLA____StrSet () Idv)

;; Axiom: SetExt
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (!
        (=>
          (forall ((smt__z Idv))
            (= (smt__TLA____Mem smt__z smt__x)
              (smt__TLA____Mem smt__z smt__y))) (= smt__x smt__y))
        :pattern ((smt__TLA____SetExtTrigger smt__x smt__y))))
    :named |SetExt|))

;; Axiom: StrLitIsstr abc
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__abc smt__TLA____StrSet)
    :named |StrLitIsstr abc|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

;; Goal
(assert
  (! (not (smt__TLA____Mem smt__TLA____StrLit__abc smt__TLA____StrSet))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
