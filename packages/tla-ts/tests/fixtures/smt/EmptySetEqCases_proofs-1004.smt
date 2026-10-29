;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Fingerprint_(_),
;;	       ASSUME NEW CONSTANT CONSTANT_S_,
;;	              NEW CONSTANT CONSTANT_T_,
;;	              CONSTANT_S_ = {} \/ CONSTANT_T_ = {} 
;;	       PROVE  CONSTANT_IsFiniteSet_([n1 : CONSTANT_S_, n2 : CONSTANT_T_]) 
;;	PROVE  CONSTANT_IsFiniteSet_([n1 : Nat, n2 : {}])
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #1004
;; Generated from file "./EmptySetEqCases_proofs.tla", line 1233, characters 3-4

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

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____RecordSet__n1__n2 (Idv Idv) Idv)

(declare-fun smt__TLA____Record__n1__n2 (Idv Idv) Idv)

(declare-fun smt__TLA____SetEnum__0 () Idv)

(declare-fun smt__TLA____SetEnum__2 (Idv Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__n1 () Idv)

(declare-fun smt__TLA____StrLit__n2 () Idv)

(declare-fun smt__TLA____StrSet () Idv)

(declare-fun smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__ (Idv
  Idv) Bool)

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

;; Axiom: EnumDefElim 0
(assert
  (!
    (forall ((smt__x Idv))
      (! (not (smt__TLA____Mem smt__x smt__TLA____SetEnum__0))
        :pattern ((smt__TLA____Mem smt__x smt__TLA____SetEnum__0))))
    :named |EnumDefElim 0|))

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

;; Axiom: StrLitIsstr n1
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__n1 smt__TLA____StrSet)
    :named |StrLitIsstr n1|))

;; Axiom: StrLitIsstr n2
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__n2 smt__TLA____StrSet)
    :named |StrLitIsstr n2|))

;; Axiom: StrLitDistinct n2 n1
(assert
  (! (distinct smt__TLA____StrLit__n2 smt__TLA____StrLit__n1)
    :named |StrLitDistinct n2 n1|))

;; Axiom: RecIsafcn n1 n2
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (! (smt__TLA____FunIsafcn (smt__TLA____Record__n1__n2 smt__x1 smt__x2))
        :pattern ((smt__TLA____Record__n1__n2 smt__x1 smt__x2))))
    :named |RecIsafcn n1 n2|))

;; Axiom: RecDomDef n1 n2
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (!
        (= (smt__TLA____FunDom (smt__TLA____Record__n1__n2 smt__x1 smt__x2))
          (smt__TLA____SetEnum__2 smt__TLA____StrLit__n1
            smt__TLA____StrLit__n2))
        :pattern ((smt__TLA____Record__n1__n2 smt__x1 smt__x2))))
    :named |RecDomDef n1 n2|))

;; Axiom: RecAppDef n1 n2
(assert
  (!
    (forall ((smt__x1 Idv) (smt__x2 Idv))
      (!
        (and
          (=
            (smt__TLA____FunApp (smt__TLA____Record__n1__n2 smt__x1 smt__x2)
              smt__TLA____StrLit__n1) smt__x1)
          (=
            (smt__TLA____FunApp (smt__TLA____Record__n1__n2 smt__x1 smt__x2)
              smt__TLA____StrLit__n2) smt__x2))
        :pattern ((smt__TLA____Record__n1__n2 smt__x1 smt__x2))))
    :named |RecAppDef n1 n2|))

;; Axiom: RecSetIntro n1 n2
(assert
  (!
    (forall ((smt__s1 Idv) (smt__s2 Idv) (smt__x1 Idv) (smt__x2 Idv))
      (!
        (=>
          (and (smt__TLA____Mem smt__x1 smt__s1)
            (smt__TLA____Mem smt__x2 smt__s2))
          (smt__TLA____Mem (smt__TLA____Record__n1__n2 smt__x1 smt__x2)
            (smt__TLA____RecordSet__n1__n2 smt__s1 smt__s2)))
        :pattern ((smt__TLA____Record__n1__n2 smt__x1 smt__x2)
                   (smt__TLA____RecordSet__n1__n2 smt__s1 smt__s2))))
    :named |RecSetIntro n1 n2|))

;; Axiom: RecSetElim n1 n2
(assert
  (!
    (forall ((smt__s1 Idv) (smt__s2 Idv) (smt__r Idv))
      (!
        (=>
          (smt__TLA____Mem smt__r
            (smt__TLA____RecordSet__n1__n2 smt__s1 smt__s2))
          (and
            (= smt__r
              (smt__TLA____Record__n1__n2
                (smt__TLA____FunApp smt__r smt__TLA____StrLit__n1)
                (smt__TLA____FunApp smt__r smt__TLA____StrLit__n2)))
            (smt__TLA____Mem
              (smt__TLA____FunApp smt__r smt__TLA____StrLit__n1) smt__s1)
            (smt__TLA____Mem
              (smt__TLA____FunApp smt__r smt__TLA____StrLit__n2) smt__s2)))
        :pattern ((smt__TLA____Mem smt__r
                    (smt__TLA____RecordSet__n1__n2 smt__s1 smt__s2)))))
    :named |RecSetElim n1 n2|))

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

(declare-fun smt__CONSTANT__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__Cardinality__ (Idv) Idv)

(declare-fun smt__CONSTANT__Fingerprint__ (Idv) Idv)

(declare-fun smt__CONSTANT__UnitEmptyRangeEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitEmptyRangeSym__ () Idv)

(declare-fun smt__CONSTANT__UnitSingletonRangeEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitSingletonRangeSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTripleRangeEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitTripleRangeSym__ () Idv)

(declare-fun smt__CONSTANT__UnitNatRangeEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitNatRangeSym__ () Idv)

(declare-fun smt__CONSTANT__UnitIntervalEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitIntervalSym__ () Idv)

(declare-fun smt__CONSTANT__UnitIntervalNatEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitIntervalNatSym__ () Idv)

(declare-fun smt__CONSTANT__UnitCapEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitCapSym__ () Idv)

(declare-fun smt__CONSTANT__UnitCupEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitCupSym__ () Idv)

(declare-fun smt__CONSTANT__UnitDiffEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitDiffSym__ () Idv)

(declare-fun smt__CONSTANT__UnitUnionEmptyEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitUnionEmptySym__ () Idv)

(declare-fun smt__CONSTANT__UnitUnionOfEmptyEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitUnionOfEmptySym__ () Idv)

(declare-fun smt__CONSTANT__UnitFilterEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitFilterSym__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdFieldEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdFieldSym__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdNatFieldEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdNatFieldSym__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdFieldNatSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleNatFirstEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleNatFirstSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleNatSecondSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleStrFirstSym__ () Idv)

(declare-fun smt__CONSTANT__UnitFcnSetEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitFcnSetSym__ () Idv)

(declare-fun smt__CONSTANT__UnitFcnSetNestedSym__ () Idv)

(declare-fun smt__CONSTANT__UnitFcnSetNatRangeEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitDiffNestedUnitEnum__ () Idv)

(declare-fun smt__CONSTANT__UnitDiffNestedUnitSym__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdFcnSetSym__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdRcdSym__ () Idv)

(declare-fun smt__CONSTANT__UnitRcdTupleSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleFcnSetSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleRcdSym__ () Idv)

(declare-fun smt__CONSTANT__UnitTupleTupleSym__ () Idv)

(declare-fun smt__CONSTANT__EmptySingletonEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptySingletonSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyIntervalEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyIntervalSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyCapEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyCapSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyCupEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyCupSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyDiffEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyDiffSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyUnionEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyUnionSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyFilterEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyFilterSym__ () Idv)

(declare-fun smt__CONSTANT__EmptySubsetEmptyEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptySubsetEmptySym__ () Idv)

(declare-fun smt__CONSTANT__EmptySubsetNatEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptySubsetNatSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyRcdEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyRcdSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyRcdNatEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyRcdNatSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyTupleEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyTupleSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyTupleNatEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyTupleNatSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyNatEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyNatSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyIntEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyIntSym__ () Idv)

(declare-fun smt__CONSTANT__EmptySeqEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptySeqSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyStrSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyRcdRangeSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyTupleRangeSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyRcdFcnSetRangeSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyTupleFcnSetRangeSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyFcnSetRangeSym__ () Idv)

(declare-fun smt__CONSTANT__EmptyFcnSetEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyFcnSetSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyFieldEnum__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyFieldSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyNameSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyArityEnum__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyAritySym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyIntervalEnum__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyIntervalSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyNatFieldEnum__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyNatFieldSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyFieldNatSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptySeqFieldSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyStrFieldSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyFcnSetSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyRcdSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyTupleSym__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyThenDiffSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyComponentEnum__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyComponentSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyPositionSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyArityEnum__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyAritySym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyIntervalEnum__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyIntervalSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyNatFirstEnum__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyNatFirstSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyNatSecondSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptySeqFirstSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyStrFirstSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyFcnSetSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyRcdSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyTupleSym__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyThenDiffSym__ () Idv)

(declare-fun smt__CONSTANT__FcnSetEqRcdSetEmpty__ () Idv)

(declare-fun smt__CONSTANT__FcnSetEqRcdSetNat__ () Idv)

(declare-fun smt__CONSTANT__FcnSetEqTupleSetEmpty__ () Idv)

(declare-fun smt__CONSTANT__FcnSetEqTupleSetNat__ () Idv)

(declare-fun smt__CONSTANT__RcdSetEqTupleSetEmpty__ () Idv)

(declare-fun smt__CONSTANT__UnitDiffRcdSetEmpty__ () Idv)

(declare-fun smt__CONSTANT__UnitDiffTupleSetEmpty__ () Idv)

(declare-fun smt__CONSTANT__RcdSetIsFcnSet__ () Idv)

(declare-fun smt__CONSTANT__TupleSetIsFcnSet__ () Idv)

(declare-fun smt__CONSTANT__TupleSetIsFcnSet3__ () Idv)

(declare-fun smt__CONSTANT__UnitEmptyRangeRev__ () Idv)

(declare-fun smt__CONSTANT__UnitSingletonRangeRev__ () Idv)

(declare-fun smt__CONSTANT__EmptySingletonRev__ () Idv)

(declare-fun smt__CONSTANT__EmptyNatRev__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyFieldRev__ () Idv)

(declare-fun smt__CONSTANT__RcdEmptyArityRev__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyComponentRev__ () Idv)

(declare-fun smt__CONSTANT__TupEmptyArityRev__ () Idv)

(declare-fun smt__CONSTANT__RcdSetEqFcnSetEmptyRev__ () Idv)

(declare-fun smt__CONSTANT__RcdSetEqFcnSetNatRev__ () Idv)

(declare-fun smt__CONSTANT__TupleSetEqFcnSetEmptyRev__ () Idv)

(declare-fun smt__CONSTANT__TupleSetEqRcdSetEmptyRev__ () Idv)

(declare-fun smt__CONSTANT__TupleSetEqRcdSetNatRev__ () Idv)

(declare-fun smt__CONSTANT__RcdSetIsFcnSetRev__ () Idv)

(declare-fun smt__CONSTANT__TupleSetIsFcnSetRev__ () Idv)

(declare-fun smt__CONSTANT__FPUnitNatRange__ () Idv)

(declare-fun smt__CONSTANT__FPUnitIntervalNatRange__ () Idv)

(declare-fun smt__CONSTANT__FPUnitFcnSetNatRange__ () Idv)

(declare-fun smt__CONSTANT__FPUnitRcdDomain__ () Idv)

(declare-fun smt__CONSTANT__FPEmptyNatDomain__ () Idv)

(declare-fun smt__CONSTANT__FPEmptyFiniteDomain__ () Idv)

(declare-fun smt__CONSTANT__FPRcdEmptyNatField__ () Idv)

(declare-fun smt__CONSTANT__FPRcdEmptyFieldNat__ () Idv)

(declare-fun smt__CONSTANT__FPTupEmptyNatFirst__ () Idv)

(declare-fun smt__CONSTANT__FPTupEmptyNatSecond__ () Idv)

(declare-fun smt__CONSTANT__FPRcdEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FPTupEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FPEmptyRcdRange__ () Idv)

(declare-fun smt__CONSTANT__FPEmptyRcdFcnSetRange__ () Idv)

(declare-fun smt__CONSTANT__FPRcdSetIsFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FPTupleSetIsFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FPMixedEmptyConstructors__ () Idv)

(declare-fun smt__CONSTANT__FPMixedUnitEmptyConstructors__ () Idv)

(declare-fun smt__CONSTANT__FPMixedNonEmptyConstructors__ () Idv)

(declare-fun smt__CONSTANT__CardUnitEmptyRange__ () Idv)

(declare-fun smt__CONSTANT__CardUnitTripleRange__ () Idv)

(declare-fun smt__CONSTANT__CardUnitInterval__ () Idv)

(declare-fun smt__CONSTANT__CardUnitCap__ () Idv)

(declare-fun smt__CONSTANT__CardUnitFilter__ () Idv)

(declare-fun smt__CONSTANT__CardUnitRcdField__ () Idv)

(declare-fun smt__CONSTANT__CardUnitTuple__ () Idv)

(declare-fun smt__CONSTANT__CardUnitFcnSet__ () Idv)

(declare-fun smt__CONSTANT__CardUnitFcnSetRange__ () Idv)

(declare-fun smt__CONSTANT__CardEmptySingleton__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__CardEmptySubsetEmpty__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyRcdDomain__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyRcdRange__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyTupleRange__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyFcnSetRange__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyField__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyArity__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyPosition__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyRcd__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyTuple__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyComponent__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyPosition__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyArity__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyRcd__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyTuple__ () Idv)

(declare-fun smt__CONSTANT__CardRcdLargeThenEmpty__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyThenLarge__ () Idv)

(declare-fun smt__CONSTANT__CardTupLargeThenEmpty__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyThenLarge__ () Idv)

(declare-fun smt__CONSTANT__CardUnitTupleLarge__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyFieldNat__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyThenDiff__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyNatSecond__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyNatField__ () Idv)

(declare-fun smt__CONSTANT__CardRcdDiffThenEmpty__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyNatFirst__ () Idv)

(declare-fun smt__CONSTANT__CardRcdEmptyFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__CardTupEmptyFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__CardUnitNatRange__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyNatDomain__ () Idv)

(declare-fun smt__CONSTANT__CardUnitFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__CardUnitSubsetRange__ () Idv)

(declare-fun smt__CONSTANT__CardEmptySubsetDomain__ () Idv)

(declare-fun smt__CONSTANT__CardUnitLargeRange__ () Idv)

(declare-fun smt__CONSTANT__CardEmptyLargeDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonNatDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonSubset__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonAsDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonSubsetDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonLargeDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonSeqEmptyDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonUnionDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSubsetSingletonFcnSet__ () Idv)

(declare-fun smt__CONSTANT__CardTupSingletonFcnSet__ () Idv)

(declare-fun smt__CONSTANT__CardRcdSingletonFcnSet__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonSubsetAsDomain__ () Idv)

(declare-fun smt__CONSTANT__CardSingletonSubsetAsRange__ () Idv)

(declare-fun smt__CONSTANT__FinUnitEmptyRange__ () Idv)

(declare-fun smt__CONSTANT__FinUnitInterval__ () Idv)

(declare-fun smt__CONSTANT__FinUnitRcdField__ () Idv)

(declare-fun smt__CONSTANT__FinUnitTuple__ () Idv)

(declare-fun smt__CONSTANT__FinUnitFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FinUnitFcnSetRange__ () Idv)

(declare-fun smt__CONSTANT__FinUnitNatRange__ () Idv)

(declare-fun smt__CONSTANT__FinUnitStrRange__ () Idv)

(declare-fun smt__CONSTANT__FinUnitFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__FinEmptySingleton__ () Idv)

(declare-fun smt__CONSTANT__FinEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__FinEmptySubsetEmpty__ () Idv)

(declare-fun smt__CONSTANT__FinEmptyRcdRange__ () Idv)

(declare-fun smt__CONSTANT__FinEmptyTupleRange__ () Idv)

(declare-fun smt__CONSTANT__FinEmptyFcnSetRange__ () Idv)

(declare-fun smt__CONSTANT__FinEmptyNatDomain__ () Idv)

(declare-fun smt__CONSTANT__FinEmptySeqDomain__ () Idv)

(declare-fun smt__CONSTANT__FinEmptyDiffDomain__ () Idv)

(declare-fun smt__CONSTANT__FinEmptyFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyField__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyArity__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyPosition__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyRcd__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyTuple__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyFieldNat__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyThenDiff__ () Idv)

(declare-fun smt__CONSTANT__FinRcdDiffThenEmpty__ () Idv)

(declare-fun smt__CONSTANT__FinRcdEmptyFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyComponent__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyPosition__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyArity__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyRcd__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyTuple__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyNatSecond__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyNatFirst__ () Idv)

(declare-fun smt__CONSTANT__FinTupDiffThenEmpty__ () Idv)

(declare-fun smt__CONSTANT__FinTupEmptyFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonNatDomain__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonIntDomain__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonStrDomain__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonDiffDomain__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonSeqDomain__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonInterval__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonRcdRange__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonTupleRange__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonSubset__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonFcnSet__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonNestedNat__ () Idv)

(declare-fun smt__CONSTANT__FinSingletonAsDomain__ () Idv)

(declare-fun smt__CONSTANT__FinSeqEmpty__ () Idv)

(declare-fun smt__CONSTANT__FinSeqEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__FinSeqEmptyRcd__ () Idv)

(declare-fun smt__CONSTANT__FinSeqEmptyTuple__ () Idv)

(declare-fun smt__CONSTANT__FinSeqEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__DomainNatReflexive__ () Idv)

(declare-fun smt__CONSTANT__DomainNatIntDiffer__ () Idv)

(declare-fun smt__CONSTANT__DomainSubsetNatReflexive__ () Idv)

(declare-fun smt__CONSTANT__RangeNatReflexive__ () Idv)

(declare-fun smt__CONSTANT__RangeNatIntDiffer__ () Idv)

(declare-fun smt__CONSTANT__DomainFcnSetReflexive__ () Idv)

(declare-fun smt__CONSTANT__RangeNestedUnitDomainDiffer__ () Idv)

(declare-fun smt__CONSTANT__RcdNatReflexive__ () Idv)

(declare-fun smt__CONSTANT__RcdNatIntDiffer__ () Idv)

(declare-fun smt__CONSTANT__RcdStrReflexive__ () Idv)

(declare-fun smt__CONSTANT__TupNatReflexive__ () Idv)

(declare-fun smt__CONSTANT__TupNatIntDiffer__ () Idv)

(declare-fun smt__CONSTANT__TupStrReflexive__ () Idv)

(declare-fun smt__CONSTANT__EmptyDiffNatRangeEnum__ () Idv)

(declare-fun smt__CONSTANT__EmptyDiffIntervalNatEnum__ () Idv)

(declare-fun smt__CONSTANT__FcnIntReflexive__ () Idv)

(declare-fun smt__CONSTANT__FcnStrLitReflexive__ () Idv)

(declare-fun smt__CONSTANT__FcnTupleReflexive__ () Idv)

(declare-fun smt__CONSTANT__RcdIntReflexive__ () Idv)

(declare-fun smt__CONSTANT__TupIntReflexive__ () Idv)

(declare-fun smt__CONSTANT__InUnitEmptyRange__ () Idv)

(declare-fun smt__CONSTANT__InUnitSingletonRange__ () Idv)

(declare-fun smt__CONSTANT__InUnitTripleRange__ () Idv)

(declare-fun smt__CONSTANT__InUnitNatRange__ () Idv)

(declare-fun smt__CONSTANT__InUnitInterval__ () Idv)

(declare-fun smt__CONSTANT__InUnitIntervalNat__ () Idv)

(declare-fun smt__CONSTANT__InUnitCap__ () Idv)

(declare-fun smt__CONSTANT__InUnitCup__ () Idv)

(declare-fun smt__CONSTANT__InUnitDiff__ () Idv)

(declare-fun smt__CONSTANT__InUnitUnionEmpty__ () Idv)

(declare-fun smt__CONSTANT__InUnitUnionOfEmpty__ () Idv)

(declare-fun smt__CONSTANT__InUnitFilter__ () Idv)

(declare-fun smt__CONSTANT__InUnitRcdField__ () Idv)

(declare-fun smt__CONSTANT__InUnitRcdFieldNat__ () Idv)

(declare-fun smt__CONSTANT__InUnitRcdNatField__ () Idv)

(declare-fun smt__CONSTANT__InUnitTuple__ () Idv)

(declare-fun smt__CONSTANT__InUnitTupleNatSecond__ () Idv)

(declare-fun smt__CONSTANT__InUnitTupleNatFirst__ () Idv)

(declare-fun smt__CONSTANT__InUnitTupleStrFirst__ () Idv)

(declare-fun smt__CONSTANT__InUnitFcnSet__ () Idv)

(declare-fun smt__CONSTANT__InUnitFcnSetNat__ () Idv)

(declare-fun smt__CONSTANT__InUnitFcnSetNested__ () Idv)

(declare-fun smt__CONSTANT__InUnitRcdFcnSet__ () Idv)

(declare-fun smt__CONSTANT__InUnitRcdRcd__ () Idv)

(declare-fun smt__CONSTANT__InUnitRcdTuple__ () Idv)

(declare-fun smt__CONSTANT__InUnitTupleFcnSet__ () Idv)

(declare-fun smt__CONSTANT__InUnitTupleRcd__ () Idv)

(declare-fun smt__CONSTANT__InUnitTupleTuple__ () Idv)

(declare-fun smt__CONSTANT__NotInUnitTuple__ () Idv)

(declare-fun smt__CONSTANT__NotInUnitRcd__ () Idv)

(declare-fun smt__CONSTANT__NotInEmpty__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptySubsetEmpty__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptySubsetNat__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyNatDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyIntDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptySeqDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyStrDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyDiffDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyRcdNatDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyTupleNatDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyFcnSetDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyFcn__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyRcdDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyRcdRange__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyTupleRange__ () Idv)

(declare-fun smt__CONSTANT__NotInEmptyFcnSetRange__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyField__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyArity__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyPosition__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyRcd__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyTuple__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyFieldNat__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyNatField__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyStrField__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyNatFieldStr__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdEmptyThenDiff__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdDiffThenEmpty__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyComponent__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyPosition__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyArity__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyInterval__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyFcnSet__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyRcd__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyTuple__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyNatFirst__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyNatSecond__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptySeqFirst__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyStrFirst__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyNatFirstStr__ () Idv)

(declare-fun smt__CONSTANT__NotInTupDiffThenEmpty__ () Idv)

(declare-fun smt__CONSTANT__NotInTupEmptyThenDiff__ () Idv)

(declare-fun smt__CONSTANT__InRcdSetIsFcnSet__ () Idv)

(declare-fun smt__CONSTANT__InFcnSetIsRcdSet__ () Idv)

(declare-fun smt__CONSTANT__InTupleSetIsFcnSet__ () Idv)

(declare-fun smt__CONSTANT__InFcnSetIsTupleSet__ () Idv)

(declare-fun smt__CONSTANT__NotInFcnSetDomain__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdSetName__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdSetArity__ () Idv)

(declare-fun smt__CONSTANT__NotInTupleSetArity__ () Idv)

(declare-fun smt__CONSTANT__NotInTupleSetOffset__ () Idv)

(declare-fun smt__CONSTANT__NotInRcdSetTuple__ () Idv)

(declare-fun smt__CONSTANT__NotInTupleSetRcd__ () Idv)

(declare-fun smt__CONSTANT__InRcdSetNat__ () Idv)

(declare-fun smt__CONSTANT__InTupleSetNat__ () Idv)

(declare-fun smt__CONSTANT__InFcnSetNatRange__ () Idv)

(declare-fun smt__CONSTANT__SubsetUnitRanges__ () Idv)

(declare-fun smt__CONSTANT__SubsetUnitNatRange__ () Idv)

(declare-fun smt__CONSTANT__SubsetEmptyDomain__ () Idv)

(declare-fun smt__CONSTANT__SubsetEmptyNatDomain__ () Idv)

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
    (forall ((smt__CONSTANT__T__ Idv))
      (=>
        (or
          (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__
            smt__CONSTANT__S__ smt__TLA____SetEnum__0)
          (smt__TLA____TrigEq__Setdollarsign__Idvdollarsign__
            smt__CONSTANT__T__ smt__TLA____SetEnum__0))
        (=
          (smt__CONSTANT__IsFiniteSet__
            (smt__TLA____RecordSet__n1__n2 smt__CONSTANT__S__
              smt__CONSTANT__T__)) smt__TLA____Tt__Idv)))))

;; Goal
(assert
  (!
    (not
      (=
        (smt__CONSTANT__IsFiniteSet__
          (smt__TLA____RecordSet__n1__n2 smt__TLA____NatSet
            smt__TLA____SetEnum__0)) smt__TLA____Tt__Idv)) :named |Goal|))

(check-sat)
(exit)
