(*---
description: Z3 proves a member of S \cap T is in T from CapDef.
ref: src/encode/n_axioms.ml#cap_def
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_
;;	PROVE  CONSTANT_x_ \in CONSTANT_S_ \cap CONSTANT_T_
;;	       => CONSTANT_x_ \in CONSTANT_T_
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cap (Idv Idv) Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetEnum__0 () Idv)

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

;; Axiom: CapDef
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____Cap smt__a smt__b))
          (and (smt__TLA____Mem smt__x smt__a)
            (smt__TLA____Mem smt__x smt__b)))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____Cap smt__a smt__b)))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____Cap smt__a smt__b))
        :pattern ((smt__TLA____Mem smt__x smt__b)
                   (smt__TLA____Cap smt__a smt__b)))) :named |CapDef|))

;; Axiom: DisjointTrigger
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (!
        (smt__TLA____SetExtTrigger (smt__TLA____Cap smt__x smt__y)
          smt__TLA____SetEnum__0) :pattern ((smt__TLA____Cap smt__x smt__y))))
    :named |DisjointTrigger|))

;; Axiom: EnumDefElim 0
(assert
  (!
    (forall ((smt__x Idv))
      (! (not (smt__TLA____Mem smt__x smt__TLA____SetEnum__0))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____SetEnum__0))))
    :named |EnumDefElim 0|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (smt__TLA____Mem smt__CONSTANT__x__
          (smt__TLA____Cap smt__CONSTANT__S__ smt__CONSTANT__T__))
        (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__T__)))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
