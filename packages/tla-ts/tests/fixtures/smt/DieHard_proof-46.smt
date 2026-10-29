;; Proof obligation:
;;	ASSUME NEW VARIABLE VARIABLE_big_,
;;	       NEW VARIABLE VARIABLE_small_,
;;	       /\ VARIABLE_small_ \in 0..3
;;	       /\ VARIABLE_big_ \in 0..5 ,
;;	       ACTION_Next_
;;	       \/ (/\ ?VARIABLE_big_#prime = VARIABLE_big_
;;	           /\ ?VARIABLE_small_#prime = VARIABLE_small_) ,
;;	       CONSTANT_Min_(VARIABLE_big_ + VARIABLE_small_, 5)
;;	       =< VARIABLE_big_ + VARIABLE_small_ ,
;;	       ?VARIABLE_big_#prime
;;	       = CONSTANT_Min_(VARIABLE_big_ + VARIABLE_small_, 5) ,
;;	       ?VARIABLE_small_#prime
;;	       = VARIABLE_small_ - (?VARIABLE_big_#prime - VARIABLE_big_) 
;;	PROVE  ?VARIABLE_big_#prime =< VARIABLE_big_ + VARIABLE_small_
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #46
;; Generated from file "./DieHard_proof.tla", line 48, characters 19-20

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntMinus (Idv Idv) Idv)

(declare-fun smt__TLA____IntPlus (Idv Idv) Idv)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

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

(declare-fun smt__VARIABLE__big__ () Idv)

(declare-fun smt__VARIABLE__big____prime () Idv)

(declare-fun smt__VARIABLE__small__ () Idv)

(declare-fun smt__VARIABLE__small____prime () Idv)

(declare-fun smt__STATE__Init__ () Idv)

(declare-fun smt__ACTION__FillSmallJug__ () Idv)

(declare-fun smt__ACTION__FillBigJug__ () Idv)

(declare-fun smt__ACTION__EmptySmallJug__ () Idv)

(declare-fun smt__ACTION__EmptyBigJug__ () Idv)

(declare-fun smt__CONSTANT__Min__ (Idv Idv) Idv)

(declare-fun smt__ACTION__SmallToBig__ () Idv)

(declare-fun smt__ACTION__BigToSmall__ () Idv)

(declare-fun smt__ACTION__Next__ () Idv)

(declare-fun smt__TEMPORAL__Spec__ () Idv)

(declare-fun smt__STATE__NotSolved__ () Idv)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(assert
  (and
    (smt__TLA____Mem smt__VARIABLE__small__
      (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
        (smt__TLA____Cast__Int 3)))
    (smt__TLA____Mem smt__VARIABLE__big__
      (smt__TLA____IntRange (smt__TLA____Cast__Int 0)
        (smt__TLA____Cast__Int 5)))))

(assert
  (or (= smt__ACTION__Next__ smt__TLA____Tt__Idv)
    (and (= smt__VARIABLE__big____prime smt__VARIABLE__big__)
      (= smt__VARIABLE__small____prime smt__VARIABLE__small__))))

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

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
  (smt__TLA____IntLteq
    (smt__CONSTANT__Min__
      (smt__TLA____IntPlus smt__VARIABLE__big__ smt__VARIABLE__small__)
      (smt__TLA____Cast__Int 5))
    (smt__TLA____IntPlus smt__VARIABLE__big__ smt__VARIABLE__small__)))

(assert
  (= smt__VARIABLE__big____prime
    (smt__CONSTANT__Min__
      (smt__TLA____IntPlus smt__VARIABLE__big__ smt__VARIABLE__small__)
      (smt__TLA____Cast__Int 5))))

(assert
  (= smt__VARIABLE__small____prime
    (smt__TLA____IntMinus smt__VARIABLE__small__
      (smt__TLA____IntMinus smt__VARIABLE__big____prime smt__VARIABLE__big__))))

;; Goal
(assert
  (!
    (not
      (smt__TLA____IntLteq smt__VARIABLE__big____prime
        (smt__TLA____IntPlus smt__VARIABLE__big__ smt__VARIABLE__small__)))
    :named |Goal|))

(check-sat)
(exit)
