(*---
description: >-
  Z3 proves two sets equal from a hypothesis that they have the same members, through the SetExt
  axiom tlapm emits.
ref: src/encode/n_axioms.ml#set_ext
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_,
;;	       \A CONSTANT_z_ :
;;	          CONSTANT_z_ \in CONSTANT_S_ <=> CONSTANT_z_ \in CONSTANT_T_ 
;;	PROVE  CONSTANT_S_ = CONSTANT_T_
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

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

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

(assert
  (forall ((smt__CONSTANT__z__ Idv))
    (= (smt__TLA____Mem smt__CONSTANT__z__ smt__CONSTANT__S__)
      (smt__TLA____Mem smt__CONSTANT__z__ smt__CONSTANT__T__))))

;; Goal
(assert (! (not (= smt__CONSTANT__S__ smt__CONSTANT__T__)) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
