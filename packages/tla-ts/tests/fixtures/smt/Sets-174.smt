;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Cardinality_(_),
;;	       \A CONSTANT_S_ :
;;	          CONSTANT_IsFiniteSet_(CONSTANT_S_)
;;	          => CONSTANT_Cardinality_(CONSTANT_S_) \in Nat 
;;	PROVE  \A CONSTANT_S_ :
;;	          CONSTANT_IsFiniteSet_(CONSTANT_S_)
;;	          /\ CONSTANT_Cardinality_(CONSTANT_S_) = 0
;;	          => (\A CONSTANT_T_ :
;;	                 (/\ CONSTANT_IsFiniteSet_(CONSTANT_T_)
;;	                  /\ CONSTANT_Cardinality_(CONSTANT_T_)
;;	                     < CONSTANT_Cardinality_(CONSTANT_S_))
;;	                 => (\A CONSTANT_f_ \in [CONSTANT_S_ -> CONSTANT_T_] :
;;	                        \E CONSTANT_x_, CONSTANT_y_ \in CONSTANT_S_ :
;;	                           CONSTANT_x_ # CONSTANT_y_
;;	                           /\ CONSTANT_f_[CONSTANT_x_]
;;	                              = CONSTANT_f_[CONSTANT_y_]))
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #174
;; Generated from file "./Sets.tla", line 280, characters 3-4

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

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____Tt__Idv () Idv)

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

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_NatInductiveDefHypothesis_' (second-order)

; omitted declaration of 'CONSTANT_NatInductiveDefConclusion_' (second-order)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_FiniteNatInductiveDefHypothesis_' (second-order)

; omitted declaration of 'CONSTANT_FiniteNatInductiveDefConclusion_' (second-order)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__IsBijection__ (Idv Idv Idv) Idv)

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (forall ((smt__CONSTANT__S__ Idv))
    (=>
      (= (smt__CONSTANT__IsFiniteSet__ smt__CONSTANT__S__)
        smt__TLA____Tt__Idv)
      (smt__TLA____Mem (smt__CONSTANT__Cardinality__ smt__CONSTANT__S__)
        smt__TLA____NatSet))))

;; Goal
(assert
  (!
    (not
      (forall ((smt__CONSTANT__S__ Idv))
        (=>
          (and
            (= (smt__CONSTANT__IsFiniteSet__ smt__CONSTANT__S__)
              smt__TLA____Tt__Idv)
            (= (smt__CONSTANT__Cardinality__ smt__CONSTANT__S__)
              (smt__TLA____Cast__Int 0)))
          (forall ((smt__CONSTANT__T__ Idv))
            (=>
              (and
                (= (smt__CONSTANT__IsFiniteSet__ smt__CONSTANT__T__)
                  smt__TLA____Tt__Idv)
                (and
                  (smt__TLA____IntLteq
                    (smt__CONSTANT__Cardinality__ smt__CONSTANT__T__)
                    (smt__CONSTANT__Cardinality__ smt__CONSTANT__S__))
                  (distinct (smt__CONSTANT__Cardinality__ smt__CONSTANT__T__)
                    (smt__CONSTANT__Cardinality__ smt__CONSTANT__S__))))
              (forall ((smt__CONSTANT__f__ Idv))
                (=>
                  (smt__TLA____Mem smt__CONSTANT__f__
                    (smt__TLA____FunSet smt__CONSTANT__S__ smt__CONSTANT__T__))
                  (exists ((smt__CONSTANT__x__ Idv) (smt__CONSTANT__y__ Idv))
                    (and
                      (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__S__)
                      (smt__TLA____Mem smt__CONSTANT__y__ smt__CONSTANT__S__)
                      (and (distinct smt__CONSTANT__x__ smt__CONSTANT__y__)
                        (=
                          (smt__TLA____FunApp smt__CONSTANT__f__
                            smt__CONSTANT__x__)
                          (smt__TLA____FunApp smt__CONSTANT__f__
                            smt__CONSTANT__y__)))))))))))) :named |Goal|))

(check-sat)
(exit)
