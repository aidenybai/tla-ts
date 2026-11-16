(*---
description: 'Z3 proves x = "a" => x # "b" through StrLitDistinct.'
ref: src/encode/n_axioms.ml#strlit_distinct
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_
;;	PROVE  CONSTANT_x_ = "a" => CONSTANT_x_ # "b"
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__a () Idv)

(declare-fun smt__TLA____StrLit__b () Idv)

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

;; Axiom: StrLitIsstr a
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__a smt__TLA____StrSet)
    :named |StrLitIsstr a|))

;; Axiom: StrLitIsstr b
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__b smt__TLA____StrSet)
    :named |StrLitIsstr b|))

;; Axiom: StrLitDistinct b a
(assert
  (! (distinct smt__TLA____StrLit__b smt__TLA____StrLit__a)
    :named |StrLitDistinct b a|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

;; Goal
(assert
  (!
    (not
      (=> (= smt__CONSTANT__x__ smt__TLA____StrLit__a)
        (distinct smt__CONSTANT__x__ smt__TLA____StrLit__b))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
