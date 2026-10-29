;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_
;;	PROVE  DOMAIN [foo |-> CONSTANT_x_, bar |-> CONSTANT_y_] = {"foo", "bar"}
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1
;; Generated from file "./recorddom_test.tla", line 8, characters 5-11

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Record__bar__foo (Idv Idv) Idv)

(declare-fun smt__TLA____SetEnum__2 (Idv Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__bar () Idv)

(declare-fun smt__TLA____StrLit__foo () Idv)

(declare-fun smt__TLA____StrSet () Idv)

(declare-fun smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ (Idv
  Idv) Bool)

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

;; Axiom: StrLitIsstr bar
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__bar smt__TLA____StrSet)
    :named |StrLitIsstr bar|))

;; Axiom: StrLitIsstr foo
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__foo smt__TLA____StrSet)
    :named |StrLitIsstr foo|))

;; Axiom: StrLitDistinct foo bar
(assert
  (! (distinct smt__TLA____StrLit__foo smt__TLA____StrLit__bar)
    :named |StrLitDistinct foo bar|))

;; Axiom: RecIsafcn bar foo
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (!
        (smt__TLA____FunIsafcn (smt__TLA____Record__bar__foo smt__x1 smt__x2))
        :pattern ((smt__TLA____Record__bar__foo smt__x1 smt__x2))))
    :named |RecIsafcn bar foo|))

;; Axiom: RecDomDef bar foo
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (!
        (=
          (smt__TLA____FunDom (smt__TLA____Record__bar__foo smt__x1 smt__x2))
          (smt__TLA____SetEnum__2 smt__TLA____StrLit__bar
            smt__TLA____StrLit__foo))
        :pattern ((smt__TLA____Record__bar__foo smt__x1 smt__x2))))
    :named |RecDomDef bar foo|))

;; Axiom: RecAppDef bar foo
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (!
        (and
          (=
            (smt__TLA____FunApp
              (smt__TLA____Record__bar__foo smt__x1 smt__x2)
              smt__TLA____StrLit__bar) smt__x1)
          (=
            (smt__TLA____FunApp
              (smt__TLA____Record__bar__foo smt__x1 smt__x2)
              smt__TLA____StrLit__foo) smt__x2))
        :pattern ((smt__TLA____Record__bar__foo smt__x1 smt__x2))))
    :named |RecAppDef bar foo|))

;; Axiom: ExtTrigEqDef Set$Idv$
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (!
        (= (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ smt__x smt__y)
          (= smt__x smt__y))
        :pattern ((smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ 
                    smt__x smt__y)))) :named |ExtTrigEqDef Set$Idv$|))

;; Axiom: ExtTrigEqTrigger Idv
(assert
  (!
    (forall ((smt__x Idv) (smt__y Idv))
      (! (smt__TLA____SetExtTrigger smt__x smt__y)
        :pattern ((smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ 
                    smt__x smt__y)))) :named |ExtTrigEqTrigger Idv|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__y__ () Idv)

;; Goal
(assert
  (!
    (not
      (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__
        (smt__TLA____FunDom
          (smt__TLA____Record__bar__foo smt__CONSTANT__y__ smt__CONSTANT__x__))
        (smt__TLA____SetEnum__2 smt__TLA____StrLit__foo
          smt__TLA____StrLit__bar))) :named |Goal|))

(check-sat)
(exit)
