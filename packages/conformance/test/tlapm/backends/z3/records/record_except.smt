(*---
description: Z3 proves [r EXCEPT !.a = z].a = z for r in a record set.
ref: src/encode/n_axioms.ml#fcnexceptapp1_def
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_,
;;	       NEW CONSTANT CONSTANT_r_,
;;	       NEW CONSTANT CONSTANT_z_
;;	PROVE  CONSTANT_r_ \in [a : CONSTANT_S_, b : CONSTANT_T_]
;;	       => [CONSTANT_r_ EXCEPT !.a = CONSTANT_z_].a = CONSTANT_z_
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

(declare-fun smt__TLA____FunExcept (Idv Idv Idv) Idv)

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

;; Axiom: FunExceptIsafcn
(assert
  (!
    (forall ((smt__f Idv) (smt__x Idv) (smt__y Idv))
      (! (smt__TLA____FunIsafcn (smt__TLA____FunExcept smt__f smt__x smt__y))
        :pattern ((smt__TLA____FunExcept smt__f smt__x smt__y))))
    :named |FunExceptIsafcn|))

;; Axiom: FunExceptDomDef
(assert
  (!
    (forall ((smt__f Idv) (smt__x Idv) (smt__y Idv))
      (!
        (= (smt__TLA____FunDom (smt__TLA____FunExcept smt__f smt__x smt__y))
          (smt__TLA____FunDom smt__f))
        :pattern ((smt__TLA____FunExcept smt__f smt__x smt__y))))
    :named |FunExceptDomDef|))

;; Axiom: FunExceptAppDef1
(assert
  (!
    (forall ((smt__f Idv) (smt__x Idv) (smt__y Idv))
      (!
        (=> (smt__TLA____Mem smt__x (smt__TLA____FunDom smt__f))
          (=
            (smt__TLA____FunApp (smt__TLA____FunExcept smt__f smt__x smt__y)
              smt__x) smt__y))
        :pattern ((smt__TLA____FunExcept smt__f smt__x smt__y))))
    :named |FunExceptAppDef1|))

;; Axiom: FunExceptAppDef2
(assert
  (!
    (forall ((smt__f Idv) (smt__x Idv) (smt__y Idv) (smt__z Idv))
      (!
        (=> (smt__TLA____Mem smt__z (smt__TLA____FunDom smt__f))
          (and
            (=> (= smt__z smt__x)
              (=
                (smt__TLA____FunApp
                  (smt__TLA____FunExcept smt__f smt__x smt__y) smt__z) 
                smt__y))
            (=> (distinct smt__z smt__x)
              (=
                (smt__TLA____FunApp
                  (smt__TLA____FunExcept smt__f smt__x smt__y) smt__z)
                (smt__TLA____FunApp smt__f smt__z)))))
        :pattern ((smt__TLA____FunApp
                    (smt__TLA____FunExcept smt__f smt__x smt__y) smt__z))
        :pattern ((smt__TLA____FunExcept smt__f smt__x smt__y)
                   (smt__TLA____FunApp smt__f smt__z))))
    :named |FunExceptAppDef2|))

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

;; Axiom: RecExcept a b 1
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv) (smt__x Idv))
      (!
        (=
          (smt__TLA____FunExcept (smt__TLA____Record__a__b smt__x1 smt__x2)
            smt__TLA____StrLit__a smt__x)
          (smt__TLA____Record__a__b smt__x smt__x2))
        :pattern ((smt__TLA____FunExcept
                    (smt__TLA____Record__a__b smt__x1 smt__x2)
                    smt__TLA____StrLit__a smt__x)))) :named |RecExcept a b 1|))

;; Axiom: RecExcept a b 2
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv) (smt__x Idv))
      (!
        (=
          (smt__TLA____FunExcept (smt__TLA____Record__a__b smt__x1 smt__x2)
            smt__TLA____StrLit__b smt__x)
          (smt__TLA____Record__a__b smt__x1 smt__x))
        :pattern ((smt__TLA____FunExcept
                    (smt__TLA____Record__a__b smt__x1 smt__x2)
                    smt__TLA____StrLit__b smt__x)))) :named |RecExcept a b 2|))

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

(declare-fun smt__CONSTANT__r__ () Idv)

(declare-fun smt__CONSTANT__z__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (smt__TLA____Mem smt__CONSTANT__r__
          (smt__TLA____RecordSet__a__b smt__CONSTANT__S__ smt__CONSTANT__T__))
        (=
          (smt__TLA____FunApp
            (smt__TLA____FunExcept smt__CONSTANT__r__ smt__TLA____StrLit__a
              smt__CONSTANT__z__) smt__TLA____StrLit__a) smt__CONSTANT__z__)))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
