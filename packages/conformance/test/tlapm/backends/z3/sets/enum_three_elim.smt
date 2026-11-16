(*---
description: Z3 proves that a member of a three-element enumeration is one of the three, from EnumDefElim 3.
ref: src/encode/n_axioms.ml#setenum_elim
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_,
;;	       NEW CONSTANT CONSTANT_w_,
;;	       NEW CONSTANT CONSTANT_z_
;;	PROVE  CONSTANT_z_ \in {CONSTANT_x_, CONSTANT_y_, CONSTANT_w_}
;;	       => CONSTANT_z_ = CONSTANT_x_ \/ CONSTANT_z_ = CONSTANT_y_
;;	          \/ CONSTANT_z_ = CONSTANT_w_
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetEnum__3 (Idv Idv Idv) Idv)

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

;; Axiom: EnumDefIntro 3
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv) (smt__a3 Idv))
      (!
        (and
          (smt__TLA____Mem smt__a1
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))
          (smt__TLA____Mem smt__a2
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))
          (smt__TLA____Mem smt__a3
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3)))
        :pattern ((smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))))
    :named |EnumDefIntro 3|))

;; Axiom: EnumDefElim 3
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv) (smt__a3 Idv) (smt__x Idv))
      (!
        (=>
          (smt__TLA____Mem smt__x
            (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3))
          (or (= smt__x smt__a1) (= smt__x smt__a2) (= smt__x smt__a3)))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetEnum__3 smt__a1 smt__a2 smt__a3)))))
    :named |EnumDefElim 3|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__y__ () Idv)

(declare-fun smt__CONSTANT__w__ () Idv)

(declare-fun smt__CONSTANT__z__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (smt__TLA____Mem smt__CONSTANT__z__
          (smt__TLA____SetEnum__3 smt__CONSTANT__x__ smt__CONSTANT__y__
            smt__CONSTANT__w__))
        (or
          (or (= smt__CONSTANT__z__ smt__CONSTANT__x__)
            (= smt__CONSTANT__z__ smt__CONSTANT__y__))
          (= smt__CONSTANT__z__ smt__CONSTANT__w__)))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
