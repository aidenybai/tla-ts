(*---
description: 'Z3 proves a member of {F(a) : a \in S} is F of some member of S, from SetOfElim.'
ref: src/encode/n_axioms.ml#setof_elim
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_z_,
;;	       NEW CONSTANT CONSTANT_F_(_)
;;	PROVE  CONSTANT_z_
;;	       \in {CONSTANT_F_(CONSTANT_a_) : CONSTANT_a_ \in CONSTANT_S_}
;;	       => (\E CONSTANT_a_ \in CONSTANT_S_ :
;;	              CONSTANT_z_ = CONSTANT_F_(CONSTANT_a_))
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____IsSetOf (Idv) Bool)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

; omitted declaration of 'TLA__SetOf_1' (second-order)

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

;; Axiom: CompareSetOfTrigger
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv))
      (! (smt__TLA____SetExtTrigger smt__a smt__b)
        :pattern ((smt__TLA____IsSetOf smt__a) (smt__TLA____IsSetOf smt__b))))
    :named |CompareSetOfTrigger|))

; omitted fact (second-order)

; omitted fact (second-order)

; omitted fact (second-order)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__z__ () Idv)

(declare-fun smt__CONSTANT__F__ (Idv) Idv)

(declare-fun smt__TLA____SetOf__1__flatnd__1 (Idv) Idv)

;; Axiom: SetOfIntro 1 TLA__SetOf_1_flatnd_1
(assert
  (!
    (forall ((smt__a1 Idv) (smt__y1 Idv))
      (!
        (=> (smt__TLA____Mem smt__y1 smt__a1)
          (smt__TLA____Mem (smt__CONSTANT__F__ smt__y1)
            (smt__TLA____SetOf__1__flatnd__1 smt__a1)))
        :pattern ((smt__CONSTANT__F__ smt__y1)
                   (smt__TLA____SetOf__1__flatnd__1 smt__a1))
        :pattern ((smt__TLA____SetOf__1__flatnd__1 smt__a1)
                   (smt__TLA____Mem smt__y1 smt__a1))))
    :named |SetOfIntro 1 TLA__SetOf_1_flatnd_1|))

;; Axiom: SetOfElim 1 TLA__SetOf_1_flatnd_1
(assert
  (!
    (forall ((smt__a1 Idv) (smt__x Idv))
      (!
        (=>
          (smt__TLA____Mem smt__x (smt__TLA____SetOf__1__flatnd__1 smt__a1))
          (exists ((smt__y1 Idv))
            (and (smt__TLA____Mem smt__y1 smt__a1)
              (= smt__x (smt__CONSTANT__F__ smt__y1)))))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetOf__1__flatnd__1 smt__a1)))))
    :named |SetOfElim 1 TLA__SetOf_1_flatnd_1|))

;; Axiom: AssertIsSetOf 1 TLA__SetOf_1_flatnd_1
(assert
  (!
    (forall ((smt__a Idv))
      (! (smt__TLA____IsSetOf (smt__TLA____SetOf__1__flatnd__1 smt__a))
        :pattern ((smt__TLA____SetOf__1__flatnd__1 smt__a))))
    :named |AssertIsSetOf 1 TLA__SetOf_1_flatnd_1|))

;; Goal
(assert
  (!
    (not
      (=>
        (smt__TLA____Mem smt__CONSTANT__z__
          (smt__TLA____SetOf__1__flatnd__1 smt__CONSTANT__S__))
        (exists ((smt__CONSTANT__a__ Idv))
          (and (smt__TLA____Mem smt__CONSTANT__a__ smt__CONSTANT__S__)
            (= smt__CONSTANT__z__ (smt__CONSTANT__F__ smt__CONSTANT__a__))))))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
