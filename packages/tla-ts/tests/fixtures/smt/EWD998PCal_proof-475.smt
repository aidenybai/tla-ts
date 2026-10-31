;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_N_,
;;	       NEW VARIABLE VARIABLE_network_,
;;	       NEW VARIABLE VARIABLE_active_,
;;	       NEW VARIABLE VARIABLE_color_,
;;	       NEW VARIABLE VARIABLE_counter_,
;;	       CONSTANT_N_ \in Nat \ {0} ,
;;	       /\ VARIABLE_active_ \in [CONSTANT_Node_ -> BOOLEAN]
;;	       /\ VARIABLE_color_ \in [CONSTANT_Node_ -> CONSTANT_ColorSet_]
;;	       /\ VARIABLE_counter_ \in [CONSTANT_Node_ -> Int]
;;	       /\ /\ VARIABLE_network_
;;	             \in [CONSTANT_Node_ -> CONSTANT_BagOf_(CONSTANT_Msg_)]
;;	          /\ \E CONSTANT_n_ \in CONSTANT_Node_ :
;;	                \E CONSTANT_t_ \in DOMAIN VARIABLE_network_[CONSTANT_n_] :
;;	                   /\ CONSTANT_t_.type = "tok"
;;	                   /\ VARIABLE_network_[CONSTANT_n_][CONSTANT_t_] = 1
;;	                   /\ \A CONSTANT_n2_ \in CONSTANT_Node_ :
;;	                         \A CONSTANT_t2_
;;	                            \in DOMAIN VARIABLE_network_[CONSTANT_n2_] :
;;	                            CONSTANT_t2_.type = "tok"
;;	                            => CONSTANT_n2_ = CONSTANT_n_
;;	                               /\ CONSTANT_t2_ = CONSTANT_t_ ,
;;	       ACTION_Next_ \/ ?h6fbaa = STATE_vars_ ,
;;	       NEW CONSTANT CONSTANT_self_ \in CONSTANT_Node_,
;;	       ACTION_node_(CONSTANT_self_) ,
;;	       NEW CONSTANT CONSTANT_to_ \in CONSTANT_Node_ \ {CONSTANT_self_},
;;	       NEW CONSTANT CONSTANT_n0_ \in CONSTANT_Node_,
;;	       NEW CONSTANT CONSTANT_t0_ \in DOMAIN VARIABLE_network_[CONSTANT_n0_],
;;	       NEW CONSTANT CONSTANT_n2_ \in CONSTANT_Node_,
;;	       NEW CONSTANT CONSTANT_t2_ \in DOMAIN ?VARIABLE_network_#prime[CONSTANT_n2_],
;;	       CONSTANT_t2_.type = "tok" ,
;;	       CONSTANT_n2_ = CONSTANT_to_ ,
;;	       CONSTANT_t2_ \in DOMAIN VARIABLE_network_[CONSTANT_to_] 
;;	PROVE  CONSTANT_t2_ \in DOMAIN VARIABLE_network_[CONSTANT_n2_]
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #475
;; Generated from file "./EWD998PCal_proof.tla", line 622, characters 25-26

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Anon__OPAQUE__h6fbaa () Idv)

(declare-fun smt__TLA____BoolSet () Idv)

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

(declare-fun smt__TLA____SetEnum__1 (Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____SetMinus (Idv Idv) Idv)

(declare-fun smt__TLA____StrLit__tok () Idv)

(declare-fun smt__TLA____StrLit__type () Idv)

(declare-fun smt__TLA____StrSet () Idv)

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

;; Axiom: StrLitIsstr tok
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__tok smt__TLA____StrSet)
    :named |StrLitIsstr tok|))

;; Axiom: StrLitIsstr type
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__type smt__TLA____StrSet)
    :named |StrLitIsstr type|))

;; Axiom: StrLitDistinct tok type
(assert
  (! (distinct smt__TLA____StrLit__tok smt__TLA____StrLit__type)
    :named |StrLitDistinct tok type|))

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

(declare-fun smt__CONSTANT__IsABag__ (Idv) Idv)

(declare-fun smt__CONSTANT__BagToSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__SetToBag__ (Idv) Idv)

(declare-fun smt__CONSTANT__BagIn__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__EmptyBag__ () Idv)

(declare-fun smt__CONSTANT__leftparenthesis__plussign__rightparenthesis____ (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__leftparenthesis__hyphen__rightparenthesis____ (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__Sum__ (Idv) Idv)

(declare-fun smt__CONSTANT__BagUnion__ (Idv) Idv)

(declare-fun smt__CONSTANT__backslash__sqsubseteq__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__SubBag__ (Idv) Idv)

; omitted declaration of 'CONSTANT_BagOfAll_' (second-order)

(declare-fun smt__CONSTANT__BagCardinality__ (Idv) Idv)

(declare-fun smt__CONSTANT__IsABag___1 (Idv) Idv)

(declare-fun smt__CONSTANT__BagToSet___1 (Idv) Idv)

(declare-fun smt__CONSTANT__SetToBag___1 (Idv) Idv)

(declare-fun smt__CONSTANT__BagIn___1 (Idv Idv) Idv)

(declare-fun smt__CONSTANT__EmptyBag___1 () Idv)

(declare-fun smt__CONSTANT__leftparenthesis__plussign__rightparenthesis_____1 (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__leftparenthesis__hyphen__rightparenthesis_____1 (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__Sumdollarsign__60__ (Idv) Idv)

(declare-fun smt__CONSTANT__BagUnion___1 (Idv) Idv)

(declare-fun smt__CONSTANT__backslash__sqsubseteq___1 (Idv Idv) Idv)

(declare-fun smt__CONSTANT__SubBag___1 (Idv) Idv)

; omitted declaration of 'CONSTANT_BagOfAll_' (second-order)

(declare-fun smt__CONSTANT__BagCardinality___1 (Idv) Idv)

; omitted declaration of 'CONSTANT_MapThenFoldSet_' (second-order)

(declare-fun smt__CONSTANT__BagAdd__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__BagRemove__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__BagRemoveAll__ (Idv Idv) Idv)

; omitted declaration of 'CONSTANT_MapThenFoldBag_' (second-order)

; omitted declaration of 'CONSTANT_FoldBag_' (second-order)

(declare-fun smt__CONSTANT__SumBag__ (Idv) Idv)

(declare-fun smt__CONSTANT__ProductBag__ (Idv) Idv)

(declare-fun smt__CONSTANT__N__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Node__ () Idv)

(declare-fun smt__CONSTANT__Initiator__ () Idv)

(declare-fun smt__VARIABLE__network__ () Idv)

(declare-fun smt__VARIABLE__network____prime () Idv)

(declare-fun smt__VARIABLE__active__ () Idv)

(declare-fun smt__VARIABLE__active____prime () Idv)

(declare-fun smt__VARIABLE__color__ () Idv)

(declare-fun smt__VARIABLE__color____prime () Idv)

(declare-fun smt__VARIABLE__counter__ () Idv)

(declare-fun smt__VARIABLE__counter____prime () Idv)

(declare-fun smt__STATE__vars__ () Idv)

(declare-fun smt__CONSTANT__ProcSet__ () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__node__ (Idv) Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__token__ () Idv)

(declare-fun smt__STATE__pending__ () Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__IsFiniteSet__ (Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Cardinality__ (Idv) Idv)

; omitted declaration of 'CONSTANT_EWD998!MapThenFoldSet_' (second-order)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Restrict__ (Idv Idv) Idv)

; omitted declaration of 'CONSTANT_EWD998!RestrictDomain_' (second-order)

; omitted declaration of 'CONSTANT_EWD998!RestrictValues_' (second-order)

(declare-fun smt__CONSTANT__EWD998exclamationmark__IsRestriction__ (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Range__ (Idv) Idv)

; omitted declaration of 'CONSTANT_EWD998!Pointwise_' (second-order)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Inverse__ (Idv Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__AntiFunction__ (Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__IsInjective__ (Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Injection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Surjection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Bijection__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__ExistsInjection__ (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__ExistsSurjection__ (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__ExistsBijection__ (Idv
  Idv) Idv)

; omitted declaration of 'CONSTANT_EWD998!FoldFunctionOnSet_' (second-order)

; omitted declaration of 'CONSTANT_EWD998!FoldFunction_' (second-order)

(declare-fun smt__CONSTANT__EWD998exclamationmark__SumFunctionOnSet__ (Idv
  Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__SumFunction__ (Idv) Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Node__ () Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Color__ () Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Token__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__vars__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TypeOK__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__Init__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__InitiateProbe__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__PassToken__ (Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__System__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__SendMsg__ (Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__RecvMsg__ (Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__Deactivate__ (Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__Environment__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__Next__ () Idv)

(declare-fun smt__TEMPORAL__EWD998exclamationmark__Spec__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__StateConstraint__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__terminationDetected__ () Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Sum__ (Idv Idv) Idv)

(declare-fun smt__STATE__EWD998exclamationmark__B__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__Termination__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TerminationDetection__ () Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__Rng__ (Idv Idv) Idv)

(declare-fun smt__STATE__EWD998exclamationmark__Inv__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TypedInv__ () Idv)

(declare-fun smt__TEMPORAL__EWD998exclamationmark__Liveness__ () Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__TDexclamationmark__Node__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TDexclamationmark__TypeOK__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TDexclamationmark__terminated__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TDexclamationmark__Init__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__Terminate__ (Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__SendMsg__ (Idv
  Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__RcvMsg__ (Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__DetectTermination__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__Next__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TDexclamationmark__vars__ () Idv)

(declare-fun smt__TEMPORAL__EWD998exclamationmark__TDexclamationmark__Spec__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__NextOrUnchanged__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TDexclamationmark__StateConstraint__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TDexclamationmark__Safe__ () Idv)

(declare-fun smt__TEMPORAL__EWD998exclamationmark__TDexclamationmark__Quiescence__ () Idv)

(declare-fun smt__TEMPORAL__EWD998exclamationmark__TDexclamationmark__Live__ () Idv)

(declare-fun smt__STATE__EWD998exclamationmark__TDexclamationmark__IndInv__ () Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__QuiescenceAsActionInv__ () Idv)

(declare-fun smt__CONSTANT__EWD998exclamationmark__TDexclamationmark__QuiescenceAsTraceInv__ (Idv) Idv)

(declare-fun smt__ACTION__EWD998exclamationmark__TDexclamationmark__StableActionInvariant__ () Idv)

(declare-fun smt__TEMPORAL__EWD998exclamationmark__TDSpec__ () Idv)

; hidden fact

(declare-fun smt__TEMPORAL__EWD998Spec__ () Idv)

; hidden fact

(declare-fun smt__STATE__Alias__ () Idv)

(declare-fun smt__STATE__StateConstraint__ () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(assert
  (smt__TLA____Mem smt__CONSTANT__N__
    (smt__TLA____SetMinus smt__TLA____NatSet
      (smt__TLA____SetEnum__1 (smt__TLA____Cast__Int 0)))))

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__ColorSet__ () Idv)

(declare-fun smt__CONSTANT__PMsg__ () Idv)

(declare-fun smt__CONSTANT__TMsg__ () Idv)

(declare-fun smt__CONSTANT__Msg__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__BagOf__ (Idv) Idv)

(declare-fun smt__CONSTANT__InitTok__ () Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__STATE__TokenAt__ (Idv) Idv)

(assert
  (and
    (smt__TLA____Mem smt__VARIABLE__active__
      (smt__TLA____FunSet smt__CONSTANT__Node__ smt__TLA____BoolSet))
    (smt__TLA____Mem smt__VARIABLE__color__
      (smt__TLA____FunSet smt__CONSTANT__Node__ smt__CONSTANT__ColorSet__))
    (smt__TLA____Mem smt__VARIABLE__counter__
      (smt__TLA____FunSet smt__CONSTANT__Node__ smt__TLA____IntSet))
    (and
      (smt__TLA____Mem smt__VARIABLE__network__
        (smt__TLA____FunSet smt__CONSTANT__Node__
          (smt__CONSTANT__BagOf__ smt__CONSTANT__Msg__)))
      (exists ((smt__CONSTANT__n__ Idv))
        (and (smt__TLA____Mem smt__CONSTANT__n__ smt__CONSTANT__Node__)
          (exists ((smt__CONSTANT__t__ Idv))
            (and
              (smt__TLA____Mem smt__CONSTANT__t__
                (smt__TLA____FunDom
                  (smt__TLA____FunApp smt__VARIABLE__network__
                    smt__CONSTANT__n__)))
              (and
                (=
                  (smt__TLA____FunApp smt__CONSTANT__t__
                    smt__TLA____StrLit__type) smt__TLA____StrLit__tok)
                (=
                  (smt__TLA____FunApp
                    (smt__TLA____FunApp smt__VARIABLE__network__
                      smt__CONSTANT__n__) smt__CONSTANT__t__)
                  (smt__TLA____Cast__Int 1))
                (forall ((smt__CONSTANT__n2__ Idv))
                  (=>
                    (smt__TLA____Mem smt__CONSTANT__n2__
                      smt__CONSTANT__Node__)
                    (forall ((smt__CONSTANT__t2__ Idv))
                      (=>
                        (smt__TLA____Mem smt__CONSTANT__t2__
                          (smt__TLA____FunDom
                            (smt__TLA____FunApp smt__VARIABLE__network__
                              smt__CONSTANT__n2__)))
                        (=>
                          (=
                            (smt__TLA____FunApp smt__CONSTANT__t2__
                              smt__TLA____StrLit__type)
                            smt__TLA____StrLit__tok)
                          (and (= smt__CONSTANT__n2__ smt__CONSTANT__n__)
                            (= smt__CONSTANT__t2__ smt__CONSTANT__t__)))))))))))))))

(assert
  (or (= smt__ACTION__Next__ smt__TLA____Tt__Idv)
    (= smt__TLA____Anon__OPAQUE__h6fbaa smt__STATE__vars__)))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__self__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__self__ smt__CONSTANT__Node__))

(assert (= (smt__ACTION__node__ smt__CONSTANT__self__) smt__TLA____Tt__Idv))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__to__ () Idv)

(assert
  (smt__TLA____Mem smt__CONSTANT__to__
    (smt__TLA____SetMinus smt__CONSTANT__Node__
      (smt__TLA____SetEnum__1 smt__CONSTANT__self__))))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__n0__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__n0__ smt__CONSTANT__Node__))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__t0__ () Idv)

(assert
  (smt__TLA____Mem smt__CONSTANT__t0__
    (smt__TLA____FunDom
      (smt__TLA____FunApp smt__VARIABLE__network__ smt__CONSTANT__n0__))))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__n2__ () Idv)

(assert (smt__TLA____Mem smt__CONSTANT__n2__ smt__CONSTANT__Node__))

(declare-fun smt__CONSTANT__t2__ () Idv)

(assert
  (smt__TLA____Mem smt__CONSTANT__t2__
    (smt__TLA____FunDom
      (smt__TLA____FunApp smt__VARIABLE__network____prime smt__CONSTANT__n2__))))

(assert
  (= (smt__TLA____FunApp smt__CONSTANT__t2__ smt__TLA____StrLit__type)
    smt__TLA____StrLit__tok))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert (= smt__CONSTANT__n2__ smt__CONSTANT__to__))

(assert
  (smt__TLA____Mem smt__CONSTANT__t2__
    (smt__TLA____FunDom
      (smt__TLA____FunApp smt__VARIABLE__network__ smt__CONSTANT__to__))))

;; Goal
(assert
  (!
    (not
      (smt__TLA____Mem smt__CONSTANT__t2__
        (smt__TLA____FunDom
          (smt__TLA____FunApp smt__VARIABLE__network__ smt__CONSTANT__n2__))))
    :named |Goal|))

(check-sat)
(exit)
