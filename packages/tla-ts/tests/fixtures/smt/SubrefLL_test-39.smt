;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_C_,
;;	       CONSTANT_C_ = 4 
;;	PROVE  /\ 2 = 2
;;	       /\ 2 = 2
;;	       /\ 3 = 3 /\ "1fc6d" = "1fc6d"
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #39
;; Generated from file "./SubrefLL_test.tla", line 158, characters 1-7

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____StrLit__1fc6d () Idv)

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

;; Axiom: StrLitIsstr 1fc6d
(assert
  (! (smt__TLA____Mem smt__TLA____StrLit__1fc6d smt__TLA____StrSet)
    :named |StrLitIsstr 1fc6d|))

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

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__C__ () Idv)

; hidden fact

(assert (= smt__CONSTANT__C__ (smt__TLA____Cast__Int 4)))

; omitted declaration of 'CONSTANT_Op_' (second-order)

(declare-fun smt__CONSTANT__Foo__ (Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_Op3_' (second-order)

(declare-fun smt__CONSTANT__Op1__ (Idv) Idv)

(declare-fun smt__CONSTANT__SOp1__ (Idv) Idv)

; omitted declaration of 'CONSTANT_OOp1_' (second-order)

; hidden fact

; omitted declaration of 'CONSTANT_OOp4_' (second-order)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__COp__ (Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__COp2__ (Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Def1__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Def2__ () Idv)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Def3__ () Idv)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Def4__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Def5__ () Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Def6__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Def7__ () Idv)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Def8__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Def9__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Def10__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Def11__ () Idv)

; hidden fact

(declare-fun smt__CONSTANT__Def12__ () Idv)

;; Goal
(assert
  (!
    (not
      (and (= (smt__TLA____Cast__Int 2) (smt__TLA____Cast__Int 2))
        (= (smt__TLA____Cast__Int 2) (smt__TLA____Cast__Int 2))
        (and (= (smt__TLA____Cast__Int 3) (smt__TLA____Cast__Int 3))
          (= smt__TLA____StrLit__1fc6d smt__TLA____StrLit__1fc6d))))
    :named |Goal|))

(check-sat)
(exit)
