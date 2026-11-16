(*---
description: Z3 proves a record is in its record set through RecSetIntro.
ref: src/encode/n_axioms.ml#recset_intro
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_,
;;	       NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_
;;	PROVE  CONSTANT_x_ \in CONSTANT_S_ /\ CONSTANT_y_ \in CONSTANT_T_
;;	       => [a |-> CONSTANT_x_, b |-> CONSTANT_y_]
;;	          \in [a : CONSTANT_S_, b : CONSTANT_T_]
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

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____RecordSet__a__b (Idv Idv) Idv)

(declare-fun smt__TLA____Record__a__b (Idv Idv) Idv)

(declare-fun smt__TLA____SetEnum__2 (Idv Idv) Idv)

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

; omitted fact (second-order)

; omitted fact (second-order)

;; Axiom: EnumDefIntro 2
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv))
      (!
        (and
          (smt__TLA____Mem smt__a1 (smt__TLA____SetEnum__2 smt__a1 smt__a2))
          (smt__TLA____Mem smt__a2 (smt__TLA____SetEnum__2 smt__a1 smt__a2)))
        :pattern ((smt__TLA____SetEnum__2 smt__a1 smt__a2))))
    :named |EnumDefIntro 2|))

;; Axiom: EnumDefElim 2
(assert
  (!
    (forall ((smt__a1 Idv) (smt__a2 Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x (smt__TLA____SetEnum__2 smt__a1 smt__a2))
          (or (= smt__x smt__a1) (= smt__x smt__a2)))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetEnum__2 smt__a1 smt__a2)))))
    :named |EnumDefElim 2|))

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

;; Axiom: RecIsafcn a b
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (! (smt__TLA____FunIsafcn (smt__TLA____Record__a__b smt__x1 smt__x2))
        :pattern ((smt__TLA____Record__a__b smt__x1 smt__x2))))
    :named |RecIsafcn a b|))

;; Axiom: RecDomDef a b
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (!
        (= (smt__TLA____FunDom (smt__TLA____Record__a__b smt__x1 smt__x2))
          (smt__TLA____SetEnum__2 smt__TLA____StrLit__a smt__TLA____StrLit__b))
        :pattern ((smt__TLA____Record__a__b smt__x1 smt__x2))))
    :named |RecDomDef a b|))

;; Axiom: RecAppDef a b
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (!
        (and
          (=
            (smt__TLA____FunApp (smt__TLA____Record__a__b smt__x1 smt__x2)
              smt__TLA____StrLit__a) smt__x1)
          (=
            (smt__TLA____FunApp (smt__TLA____Record__a__b smt__x1 smt__x2)
              smt__TLA____StrLit__b) smt__x2))
        :pattern ((smt__TLA____Record__a__b smt__x1 smt__x2))))
    :named |RecAppDef a b|))

;; Axiom: RecSetIntro a b
(assert
  (!
    (forall ((smt__s1 Idv) (smt__s2 Idv) (smt__x1 Idv) (smt__x2 Idv))
      (!
        (=>
          (and (smt__TLA____Mem smt__x1 smt__s1)
            (smt__TLA____Mem smt__x2 smt__s2))
          (smt__TLA____Mem (smt__TLA____Record__a__b smt__x1 smt__x2)
            (smt__TLA____RecordSet__a__b smt__s1 smt__s2)))
        :pattern ((smt__TLA____Record__a__b smt__x1 smt__x2)
                   (smt__TLA____RecordSet__a__b smt__s1 smt__s2))))
    :named |RecSetIntro a b|))

;; Axiom: RecSetElim a b
(assert
  (!
    (forall ((smt__s1 Idv) (smt__s2 Idv) (smt__r Idv))
      (!
        (=>
          (smt__TLA____Mem smt__r
            (smt__TLA____RecordSet__a__b smt__s1 smt__s2))
          (and
            (= smt__r
              (smt__TLA____Record__a__b
                (smt__TLA____FunApp smt__r smt__TLA____StrLit__a)
                (smt__TLA____FunApp smt__r smt__TLA____StrLit__b)))
            (smt__TLA____Mem
              (smt__TLA____FunApp smt__r smt__TLA____StrLit__a) smt__s1)
            (smt__TLA____Mem
              (smt__TLA____FunApp smt__r smt__TLA____StrLit__b) smt__s2)))
        :pattern ((smt__TLA____Mem smt__r
                    (smt__TLA____RecordSet__a__b smt__s1 smt__s2)))))
    :named |RecSetElim a b|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__y__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (and (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__S__)
          (smt__TLA____Mem smt__CONSTANT__y__ smt__CONSTANT__T__))
        (smt__TLA____Mem
          (smt__TLA____Record__a__b smt__CONSTANT__x__ smt__CONSTANT__y__)
          (smt__TLA____RecordSet__a__b smt__CONSTANT__S__ smt__CONSTANT__T__))))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
