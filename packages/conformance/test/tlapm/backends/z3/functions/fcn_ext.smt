(*---
description: Z3 proves two functions in [S -> T] equal when they agree on S, through FunExt.
ref: src/encode/n_axioms.ml#fcn_ext
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_,
;;	       NEW CONSTANT CONSTANT_f_,
;;	       NEW CONSTANT CONSTANT_g_
;;	PROVE  CONSTANT_f_ \in [CONSTANT_S_ -> CONSTANT_T_]
;;	       /\ CONSTANT_g_ \in [CONSTANT_S_ -> CONSTANT_T_]
;;	       /\ (\A CONSTANT_a_ \in CONSTANT_S_ :
;;	              CONSTANT_f_[CONSTANT_a_] = CONSTANT_g_[CONSTANT_a_])
;;	       => CONSTANT_f_ = CONSTANT_g_
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____FunSet (Idv Idv) Idv)

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

;; Axiom: FunExt
(assert
  (!
    (forall ((smt__f Idv) (smt__g Idv))
      (!
        (=>
          (and (smt__TLA____FunIsafcn smt__f) (smt__TLA____FunIsafcn smt__g)
            (= (smt__TLA____FunDom smt__f) (smt__TLA____FunDom smt__g))
            (forall ((smt__x Idv))
              (=> (smt__TLA____Mem smt__x (smt__TLA____FunDom smt__f))
                (= (smt__TLA____FunApp smt__f smt__x)
                  (smt__TLA____FunApp smt__g smt__x))))) (= smt__f smt__g))
        :pattern ((smt__TLA____FunIsafcn smt__f)
                   (smt__TLA____FunIsafcn smt__g)))) :named |FunExt|))

; omitted fact (second-order)

;; Axiom: FunSetIntro
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__f Idv))
      (!
        (=>
          (and (smt__TLA____FunIsafcn smt__f)
            (= (smt__TLA____FunDom smt__f) smt__a)
            (forall ((smt__x Idv))
              (=> (smt__TLA____Mem smt__x smt__a)
                (smt__TLA____Mem (smt__TLA____FunApp smt__f smt__x) smt__b))))
          (smt__TLA____Mem smt__f (smt__TLA____FunSet smt__a smt__b)))
        :pattern ((smt__TLA____Mem smt__f (smt__TLA____FunSet smt__a smt__b)))))
    :named |FunSetIntro|))

;; Axiom: FunSetElim1
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__f Idv))
      (!
        (=> (smt__TLA____Mem smt__f (smt__TLA____FunSet smt__a smt__b))
          (and (smt__TLA____FunIsafcn smt__f)
            (= (smt__TLA____FunDom smt__f) smt__a)))
        :pattern ((smt__TLA____Mem smt__f (smt__TLA____FunSet smt__a smt__b)))))
    :named |FunSetElim1|))

;; Axiom: FunSetElim2
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__f Idv) (smt__x Idv))
      (!
        (=>
          (and (smt__TLA____Mem smt__f (smt__TLA____FunSet smt__a smt__b))
            (smt__TLA____Mem smt__x smt__a))
          (smt__TLA____Mem (smt__TLA____FunApp smt__f smt__x) smt__b))
        :pattern ((smt__TLA____Mem smt__f (smt__TLA____FunSet smt__a smt__b))
                   (smt__TLA____Mem smt__x smt__a))
        :pattern ((smt__TLA____Mem smt__f (smt__TLA____FunSet smt__a smt__b))
                   (smt__TLA____FunApp smt__f smt__x)))) :named |FunSetElim2|))

; omitted fact (second-order)

; omitted fact (second-order)

; omitted fact (second-order)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

(declare-fun smt__CONSTANT__f__ () Idv)

(declare-fun smt__CONSTANT__g__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (and
          (and
            (smt__TLA____Mem smt__CONSTANT__f__
              (smt__TLA____FunSet smt__CONSTANT__S__ smt__CONSTANT__T__))
            (smt__TLA____Mem smt__CONSTANT__g__
              (smt__TLA____FunSet smt__CONSTANT__S__ smt__CONSTANT__T__)))
          (forall ((smt__CONSTANT__a__ Idv))
            (=> (smt__TLA____Mem smt__CONSTANT__a__ smt__CONSTANT__S__)
              (= (smt__TLA____FunApp smt__CONSTANT__f__ smt__CONSTANT__a__)
                (smt__TLA____FunApp smt__CONSTANT__g__ smt__CONSTANT__a__)))))
        (= smt__CONSTANT__f__ smt__CONSTANT__g__))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
