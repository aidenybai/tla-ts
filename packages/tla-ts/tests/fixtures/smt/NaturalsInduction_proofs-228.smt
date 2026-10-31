;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Def_(_, _),
;;	       NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_f_,
;;	       NEW CONSTANT CONSTANT_f0_ \in CONSTANT_S_,
;;	       CONSTANT_f_
;;	       = [CONSTANT_i_ \in Nat |->
;;	            IF CONSTANT_i_ = 0
;;	              THEN CONSTANT_f0_
;;	              ELSE CONSTANT_Def_(CONSTANT_f_[CONSTANT_i_ - 1], CONSTANT_i_)] ,
;;	       CONSTANT_f0_ \in CONSTANT_S_ ,
;;	       \A CONSTANT_v_ \in CONSTANT_S_, CONSTANT_n_ \in Nat \ {0} :
;;	          CONSTANT_Def_(CONSTANT_v_, CONSTANT_n_) \in CONSTANT_S_ ,
;;	       NEW CONSTANT CONSTANT_n_ \in Nat
;;	PROVE  /\ CONSTANT_n_ + 1 \in Nat \ {0}
;;	       /\ (CONSTANT_n_ + 1) - 1 = CONSTANT_n_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #228
;; Generated from file "./NaturalsInduction_proofs.tla", line 321, characters 4-10

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntMinus (Idv Idv) Idv)

(declare-fun smt__TLA____IntPlus (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetEnum__1 (Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____SetMinus (Idv Idv) Idv)

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

;; Axiom: SetMinusDef
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____SetMinus smt__a smt__b))
          (and (smt__TLA____Mem smt__x smt__a)
            (not (smt__TLA____Mem smt__x smt__b))))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____SetMinus smt__a smt__b)))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____SetMinus smt__a smt__b))
        :pattern ((smt__TLA____Mem smt__x smt__b)
                   (smt__TLA____SetMinus smt__a smt__b))))
    :named |SetMinusDef|))

;; Axiom: NatSetDef
(assert
  (!
    (forall ((smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x smt__TLA____NatSet)
          (and (smt__TLA____Mem smt__x smt__TLA____IntSet)
            (smt__TLA____IntLteq (smt__TLA____Cast__Int 0) smt__x)))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____NatSet))))
    :named |NatSetDef|))

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

;; Axiom: EnumDefIntro 1
(assert
  (!
    (forall ((smt__a1 Idv))
      (! (smt__TLA____Mem smt__a1 (smt__TLA____SetEnum__1 smt__a1))
        :pattern ((smt__TLA____SetEnum__1 smt__a1)))) :named |EnumDefIntro 1|))

;; Axiom: EnumDefElim 1
(assert
  (!
    (forall ((smt__a1 Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x (smt__TLA____SetEnum__1 smt__a1))
          (= smt__x smt__a1))
        :pattern ((smt__TLA____Mem smt__x (smt__TLA____SetEnum__1 smt__a1)))))
    :named |EnumDefElim 1|))

;; Axiom: CastInjAlt Int
(assert
  (!
    (forall ((smt__x Int))
      (! (= smt__x (smt__TLA____Proj__Int (smt__TLA____Cast__Int smt__x)))
        :pattern ((smt__TLA____Cast__Int smt__x)))) :named |CastInjAlt Int|))

;; Axiom: TypeGuardIntro Int
(assert
  (!
    (forall ((smt__z Int))
      (! (smt__TLA____Mem (smt__TLA____Cast__Int smt__z) smt__TLA____IntSet)
        :pattern ((smt__TLA____Cast__Int smt__z))))
    :named |TypeGuardIntro Int|))

;; Axiom: TypeGuardElim Int
(assert
  (!
    (forall ((smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x smt__TLA____IntSet)
          (= smt__x (smt__TLA____Cast__Int (smt__TLA____Proj__Int smt__x))))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____IntSet))))
    :named |TypeGuardElim Int|))

;; Axiom: Typing TIntPlus
(assert
  (!
    (forall ((smt__x1 Int) (smt__x2 Int))
      (!
        (=
          (smt__TLA____IntPlus (smt__TLA____Cast__Int smt__x1)
            (smt__TLA____Cast__Int smt__x2))
          (smt__TLA____Cast__Int (+ smt__x1 smt__x2)))
        :pattern ((smt__TLA____IntPlus (smt__TLA____Cast__Int smt__x1)
                    (smt__TLA____Cast__Int smt__x2)))))
    :named |Typing TIntPlus|))

;; Axiom: Typing TIntMinus
(assert
  (!
    (forall ((smt__x1 Int) (smt__x2 Int))
      (!
        (=
          (smt__TLA____IntMinus (smt__TLA____Cast__Int smt__x1)
            (smt__TLA____Cast__Int smt__x2))
          (smt__TLA____Cast__Int (- smt__x1 smt__x2)))
        :pattern ((smt__TLA____IntMinus (smt__TLA____Cast__Int smt__x1)
                    (smt__TLA____Cast__Int smt__x2)))))
    :named |Typing TIntMinus|))

;; Axiom: Typing TIntLteq
(assert
  (!
    (forall ((smt__x1 Int) (smt__x2 Int))
      (!
        (=
          (smt__TLA____IntLteq (smt__TLA____Cast__Int smt__x1)
            (smt__TLA____Cast__Int smt__x2)) (<= smt__x1 smt__x2))
        :pattern ((smt__TLA____IntLteq (smt__TLA____Cast__Int smt__x1)
                    (smt__TLA____Cast__Int smt__x2)))))
    :named |Typing TIntLteq|))

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_NatInductiveDefHypothesis_' (second-order)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Def__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__f__ () Idv)

(declare-fun smt__CONSTANT__f0__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__f0__ smt__CONSTANT__S__))

(declare-fun smt__TLA____FunFcn__flatnd__1 (Idv) Idv)

;; Axiom: FunConstrIsafcn TLA__FunFcn_flatnd_1
(assert
  (!
    (forall ((smt__a Idv))
      (! (smt__TLA____FunIsafcn (smt__TLA____FunFcn__flatnd__1 smt__a))
        :pattern ((smt__TLA____FunFcn__flatnd__1 smt__a))))
    :named |FunConstrIsafcn TLA__FunFcn_flatnd_1|))

;; Axiom: FunDomDef TLA__FunFcn_flatnd_1
(assert
  (!
    (forall ((smt__a Idv))
      (!
        (= (smt__TLA____FunDom (smt__TLA____FunFcn__flatnd__1 smt__a)) smt__a)
        :pattern ((smt__TLA____FunFcn__flatnd__1 smt__a))))
    :named |FunDomDef TLA__FunFcn_flatnd_1|))

;; Axiom: FunAppDef TLA__FunFcn_flatnd_1
(assert
  (!
    (forall ((smt__a Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x smt__a)
          (=
            (smt__TLA____FunApp (smt__TLA____FunFcn__flatnd__1 smt__a) smt__x)
            (ite (= smt__x (smt__TLA____Cast__Int 0)) smt__CONSTANT__f0__
              (smt__CONSTANT__Def__
                (smt__TLA____FunApp smt__CONSTANT__f__
                  (smt__TLA____IntMinus smt__x (smt__TLA____Cast__Int 1)))
                smt__x))))
        :pattern ((smt__TLA____FunApp (smt__TLA____FunFcn__flatnd__1 smt__a)
                    smt__x))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____FunFcn__flatnd__1 smt__a))))
    :named |FunAppDef TLA__FunFcn_flatnd_1|))

(assert
  (= smt__CONSTANT__f__ (smt__TLA____FunFcn__flatnd__1 smt__TLA____NatSet)))

(assert (smt__TLA____Mem smt__CONSTANT__f0__ smt__CONSTANT__S__))

(assert
  (forall ((smt__CONSTANT__v__ Idv) (smt__CONSTANT__n__ Idv))
    (=>
      (and (smt__TLA____Mem smt__CONSTANT__v__ smt__CONSTANT__S__)
        (smt__TLA____Mem smt__CONSTANT__n__
          (smt__TLA____SetMinus smt__TLA____NatSet
            (smt__TLA____SetEnum__1 (smt__TLA____Cast__Int 0)))))
      (smt__TLA____Mem
        (smt__CONSTANT__Def__ smt__CONSTANT__v__ smt__CONSTANT__n__)
        smt__CONSTANT__S__))))

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__n__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__n__ smt__TLA____NatSet))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

;; Goal
(assert
  (!
    (not
      (and
        (smt__TLA____Mem
          (smt__TLA____IntPlus smt__CONSTANT__n__ (smt__TLA____Cast__Int 1))
          (smt__TLA____SetMinus smt__TLA____NatSet
            (smt__TLA____SetEnum__1 (smt__TLA____Cast__Int 0))))
        (=
          (smt__TLA____IntMinus
            (smt__TLA____IntPlus smt__CONSTANT__n__ (smt__TLA____Cast__Int 1))
            (smt__TLA____Cast__Int 1)) smt__CONSTANT__n__))) :named |Goal|))

(check-sat)
(exit)
