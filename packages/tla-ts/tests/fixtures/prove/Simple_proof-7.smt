;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_N_,
;;	       NEW VARIABLE VARIABLE_x_,
;;	       NEW VARIABLE VARIABLE_y_,
;;	       NEW VARIABLE VARIABLE_pc_,
;;	       CONSTANT_N_ \in Nat /\ CONSTANT_N_ > 0 
;;	PROVE  (/\ VARIABLE_x_ = [CONSTANT_i_ \in 0..CONSTANT_N_ - 1 |-> 0]
;;	        /\ VARIABLE_y_ = [CONSTANT_i_ \in 0..CONSTANT_N_ - 1 |-> 0]
;;	        /\ VARIABLE_pc_ = [CONSTANT_self_ \in 0..CONSTANT_N_ - 1 |-> "a"])
;;	       => (/\ /\ VARIABLE_x_ \in [0..CONSTANT_N_ - 1 -> {0, 1}]
;;	              /\ VARIABLE_y_ \in [0..CONSTANT_N_ - 1 -> {0, 1}]
;;	              /\ VARIABLE_pc_ \in [0..CONSTANT_N_ - 1 -> {"a", "b", "Done"}]
;;	           /\ \A CONSTANT_i_ \in 0..CONSTANT_N_ - 1 :
;;	                 VARIABLE_pc_[CONSTANT_i_] \in {"b", "Done"}
;;	                 => VARIABLE_x_[CONSTANT_i_] = 1
;;	           /\ \/ \E CONSTANT_i_ \in 0..CONSTANT_N_ - 1 :
;;	                    VARIABLE_pc_[CONSTANT_i_] # "Done"
;;	              \/ \E CONSTANT_i_ \in 0..CONSTANT_N_ - 1 :
;;	                    VARIABLE_y_[CONSTANT_i_] = 1)
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #7
;; Generated from file "./Simple_proof.tla", line 11, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____FunSet (Idv Idv) Idv)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntMinus (Idv Idv) Idv)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetEnum__2 (Idv Idv) Idv)

(declare-fun smt__TLA____SetEnum__3 (Idv Idv Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__Done () Idv)

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

;; Axiom: IntRangeDef
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))
      (!
        (= (smt__TLA____Mem smt__x (smt__TLA____IntRange smt__a smt__b))
          (and (smt__TLA____Mem smt__x smt__TLA____IntSet)
            (smt__TLA____IntLteq smt__a smt__x)
            (smt__TLA____IntLteq smt__x smt__b)))
        :pattern ((smt__TLA____Mem smt__x
                    (smt__TLA____IntRange smt__a smt__b)))))
    :named |IntRangeDef|))

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

;; Axiom: StrLitIsstr Done
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__Done smt__TLA____StrSet)
    :named |StrLitIsstr Done|))

;; Axiom: StrLitIsstr a
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__a smt__TLA____StrSet)
    :named |StrLitIsstr a|))

;; Axiom: StrLitIsstr b
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__b smt__TLA____StrSet)
    :named |StrLitIsstr b|))

;; Axiom: StrLitDistinct Done a
(assert
  (! (distinct smt__TLA____StrLit__Done smt__TLA____StrLit__a)
    :named |StrLitDistinct Done a|))

;; Axiom: StrLitDistinct Done b
(assert
  (! (distinct smt__TLA____StrLit__Done smt__TLA____StrLit__b)
    :named |StrLitDistinct Done b|))

;; Axiom: StrLitDistinct b a
(assert
  (! (distinct smt__TLA____StrLit__b smt__TLA____StrLit__a)
    :named |StrLitDistinct b a|))

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

(declare-fun smt__CONSTANT__N__ () Idv)

; hidden fact

(declare-fun smt__VARIABLE__x__ () Idv)

(declare-fun smt__VARIABLE__x____prime () Idv)

(declare-fun smt__VARIABLE__y__ () Idv)

(declare-fun smt__VARIABLE__y____prime () Idv)

(declare-fun smt__VARIABLE__pc__ () Idv)

(declare-fun smt__VARIABLE__pc____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__ACTION__a__ (Idv) Idv)

(declare-fun smt__ACTION__b__ (Idv) Idv)

(declare-fun smt__ACTION__proc__ (Idv) Idv)

(declare-fun smt__ACTION__Terminating__ () Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__Termination__ () Idv)

(declare-fun smt__STATE__PCorrect__ () Idv)

; hidden fact

; hidden fact

(assert
  (and (smt__TLA____Mem smt__CONSTANT__N__ smt__TLA____NatSet)
    (and (smt__TLA____IntLteq (smt__TLA____Cast__Int 0) smt__CONSTANT__N__)
      (distinct (smt__TLA____Cast__Int 0) smt__CONSTANT__N__))))

; hidden fact

; hidden fact

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
            (smt__TLA____Cast__Int 0)))
        :pattern ((smt__TLA____FunApp (smt__TLA____FunFcn__flatnd__1 smt__a)
                    smt__x))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____FunFcn__flatnd__1 smt__a))))
    :named |FunAppDef TLA__FunFcn_flatnd_1|))

;; Axiom: FunTyping TLA__FunFcn_flatnd_1
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv))
      (!
        (=>
          (forall ((smt__x Idv))
            (=> (smt__TLA____Mem smt__x smt__a)
              (smt__TLA____Mem (smt__TLA____Cast__Int 0) smt__b)))
          (smt__TLA____Mem (smt__TLA____FunFcn__flatnd__1 smt__a)
            (smt__TLA____FunSet smt__a smt__b)))
        :pattern ((smt__TLA____FunFcn__flatnd__1 smt__a)
                   (smt__TLA____FunSet smt__a smt__b))))
    :named |FunTyping TLA__FunFcn_flatnd_1|))

(declare-fun smt__TLA____FunFcn__flatnd__3 (Idv) Idv)

;; Axiom: FunConstrIsafcn TLA__FunFcn_flatnd_3
(assert
  (!
    (forall ((smt__a Idv))
      (! (smt__TLA____FunIsafcn (smt__TLA____FunFcn__flatnd__3 smt__a))
        :pattern ((smt__TLA____FunFcn__flatnd__3 smt__a))))
    :named |FunConstrIsafcn TLA__FunFcn_flatnd_3|))

;; Axiom: FunDomDef TLA__FunFcn_flatnd_3
(assert
  (!
    (forall ((smt__a Idv))
      (!
        (= (smt__TLA____FunDom (smt__TLA____FunFcn__flatnd__3 smt__a)) smt__a)
        :pattern ((smt__TLA____FunFcn__flatnd__3 smt__a))))
    :named |FunDomDef TLA__FunFcn_flatnd_3|))

;; Axiom: FunAppDef TLA__FunFcn_flatnd_3
(assert
  (!
    (forall ((smt__a Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x smt__a)
          (=
            (smt__TLA____FunApp (smt__TLA____FunFcn__flatnd__3 smt__a) smt__x)
            smt__TLA____StrLit__a))
        :pattern ((smt__TLA____FunApp (smt__TLA____FunFcn__flatnd__3 smt__a)
                    smt__x))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____FunFcn__flatnd__3 smt__a))))
    :named |FunAppDef TLA__FunFcn_flatnd_3|))

;; Axiom: FunTyping TLA__FunFcn_flatnd_3
(assert
  (!
    (forall ((smt__a Idv) (smt__b Idv))
      (!
        (=>
          (forall ((smt__x Idv))
            (=> (smt__TLA____Mem smt__x smt__a)
              (smt__TLA____Mem smt__TLA____StrLit__a smt__b)))
          (smt__TLA____Mem (smt__TLA____FunFcn__flatnd__3 smt__a)
            (smt__TLA____FunSet smt__a smt__b)))
        :pattern ((smt__TLA____FunFcn__flatnd__3 smt__a)
                   (smt__TLA____FunSet smt__a smt__b))))
    :named |FunTyping TLA__FunFcn_flatnd_3|))

;; Goal
(assert
  (!
    (not
      (=>
        (and
          (= smt__VARIABLE__x__
            (smt__TLA____FunFcn__flatnd__1
              (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                (smt__TLA____IntMinus smt__CONSTANT__N__
                  (smt__TLA____Cast__Int 1)))))
          (= smt__VARIABLE__y__
            (smt__TLA____FunFcn__flatnd__1
              (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                (smt__TLA____IntMinus smt__CONSTANT__N__
                  (smt__TLA____Cast__Int 1)))))
          (= smt__VARIABLE__pc__
            (smt__TLA____FunFcn__flatnd__3
              (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                (smt__TLA____IntMinus smt__CONSTANT__N__
                  (smt__TLA____Cast__Int 1))))))
        (and
          (and
            (smt__TLA____Mem smt__VARIABLE__x__
              (smt__TLA____FunSet
                (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                  (smt__TLA____IntMinus smt__CONSTANT__N__
                    (smt__TLA____Cast__Int 1)))
                (smt__TLA____SetEnum__2 (smt__TLA____Cast__Int 0)
                  (smt__TLA____Cast__Int 1))))
            (smt__TLA____Mem smt__VARIABLE__y__
              (smt__TLA____FunSet
                (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                  (smt__TLA____IntMinus smt__CONSTANT__N__
                    (smt__TLA____Cast__Int 1)))
                (smt__TLA____SetEnum__2 (smt__TLA____Cast__Int 0)
                  (smt__TLA____Cast__Int 1))))
            (smt__TLA____Mem smt__VARIABLE__pc__
              (smt__TLA____FunSet
                (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                  (smt__TLA____IntMinus smt__CONSTANT__N__
                    (smt__TLA____Cast__Int 1)))
                (smt__TLA____SetEnum__3 smt__TLA____StrLit__a
                  smt__TLA____StrLit__b smt__TLA____StrLit__Done))))
          (forall ((smt__CONSTANT__i__ Idv))
            (=>
              (smt__TLA____Mem smt__CONSTANT__i__
                (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                  (smt__TLA____IntMinus smt__CONSTANT__N__
                    (smt__TLA____Cast__Int 1))))
              (=>
                (smt__TLA____Mem
                  (smt__TLA____FunApp smt__VARIABLE__pc__ smt__CONSTANT__i__)
                  (smt__TLA____SetEnum__2 smt__TLA____StrLit__b
                    smt__TLA____StrLit__Done))
                (= (smt__TLA____FunApp smt__VARIABLE__x__ smt__CONSTANT__i__)
                  (smt__TLA____Cast__Int 1)))))
          (or
            (exists ((smt__CONSTANT__i__ Idv))
              (and
                (smt__TLA____Mem smt__CONSTANT__i__
                  (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                    (smt__TLA____IntMinus smt__CONSTANT__N__
                      (smt__TLA____Cast__Int 1))))
                (distinct
                  (smt__TLA____FunApp smt__VARIABLE__pc__ smt__CONSTANT__i__)
                  smt__TLA____StrLit__Done)))
            (exists ((smt__CONSTANT__i__ Idv))
              (and
                (smt__TLA____Mem smt__CONSTANT__i__
                  (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
                    (smt__TLA____IntMinus smt__CONSTANT__N__
                      (smt__TLA____Cast__Int 1))))
                (= (smt__TLA____FunApp smt__VARIABLE__y__ smt__CONSTANT__i__)
                  (smt__TLA____Cast__Int 1)))))))) :named |Goal|))

(check-sat)
(exit)
