(*---
description: Z3 proves a member of UNION T is in some member of T.
ref: src/encode/n_axioms.ml#union_elim
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_T_
;;	PROVE  CONSTANT_x_ \in UNION CONSTANT_T_
;;	       => (\E CONSTANT_s_ \in CONSTANT_T_ : CONSTANT_x_ \in CONSTANT_s_)
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____Union (Idv) Idv)

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

;; Axiom: UnionIntro
(assert
  (!
    (forall ((smt__a Idv) (smt__x Idv) (smt__y Idv))
      (!
        (=>
          (and (smt__TLA____Mem smt__y smt__a)
            (smt__TLA____Mem smt__x smt__y))
          (smt__TLA____Mem smt__x (smt__TLA____Union smt__a)))
        :pattern ((smt__TLA____Mem smt__y smt__a)
                   (smt__TLA____Mem smt__x (smt__TLA____Union smt__a)))
        :pattern ((smt__TLA____Mem smt__x smt__y)
                   (smt__TLA____Mem smt__x (smt__TLA____Union smt__a)))
        :pattern ((smt__TLA____Mem smt__y smt__a)
                   (smt__TLA____Mem smt__x smt__y) (smt__TLA____Union smt__a))))
    :named |UnionIntro|))

;; Axiom: UnionElim
(assert
  (!
    (forall ((smt__a Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x (smt__TLA____Union smt__a))
          (exists ((smt__y Idv))
            (and (smt__TLA____Mem smt__y smt__a)
              (smt__TLA____Mem smt__x smt__y))))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____Union smt__a)))))
    :named |UnionElim|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (smt__TLA____Mem smt__CONSTANT__x__
          (smt__TLA____Union smt__CONSTANT__T__))
        (exists ((smt__CONSTANT__s__ Idv))
          (and (smt__TLA____Mem smt__CONSTANT__s__ smt__CONSTANT__T__)
            (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__s__)))))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
