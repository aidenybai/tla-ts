(*---
description: Z3 proves Len(s \o t) = Len(s) + Len(t) through SeqCatLen.
ref: src/encode/n_axioms.ml#seqcatlen_def
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_s_,
;;	       NEW CONSTANT CONSTANT_t_
;;	PROVE  CONSTANT_s_ \in Seq(CONSTANT_S_) /\ CONSTANT_t_ \in Seq(CONSTANT_S_)
;;	       => Len(CONSTANT_s_ \o CONSTANT_t_)
;;	          = Len(CONSTANT_s_) + Len(CONSTANT_t_)
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____Cat (Idv Idv) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntPlus (Idv Idv) Idv)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Len (Idv) Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____Seq (Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

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

; omitted fact (second-order)

; omitted fact (second-order)

;; Axiom: SeqSetIntro
(assert
  (!
    (forall ((smt__a Idv) (smt__s Idv))
      (!
        (=>
          (and (smt__TLA____FunIsafcn smt__s)
            (>= (smt__TLA____Proj__Int (smt__TLA____Len smt__s)) 0)
            (forall ((smt__i Idv))
              (= (smt__TLA____Mem smt__i (smt__TLA____FunDom smt__s))
                (and (smt__TLA____Mem smt__i smt__TLA____IntSet)
                  (<= 1 (smt__TLA____Proj__Int smt__i))
                  (<= (smt__TLA____Proj__Int smt__i)
                    (smt__TLA____Proj__Int (smt__TLA____Len smt__s))))))
            (forall ((smt__i Int))
              (=>
                (and (<= 1 smt__i)
                  (<= smt__i (smt__TLA____Proj__Int (smt__TLA____Len smt__s))))
                (smt__TLA____Mem
                  (smt__TLA____FunApp smt__s (smt__TLA____Cast__Int smt__i))
                  smt__a))))
          (smt__TLA____Mem smt__s (smt__TLA____Seq smt__a)))
        :pattern ((smt__TLA____Mem smt__s (smt__TLA____Seq smt__a)))))
    :named |SeqSetIntro|))

;; Axiom: SetSetElim1
(assert
  (!
    (forall ((smt__a Idv) (smt__s Idv))
      (!
        (=> (smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
          (and (smt__TLA____FunIsafcn smt__s)
            (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
            (= (smt__TLA____FunDom smt__s)
              (smt__TLA____IntRange (smt__TLA____Cast__Int 1)
                (smt__TLA____Len smt__s)))))
        :pattern ((smt__TLA____Mem smt__s (smt__TLA____Seq smt__a)))))
    :named |SetSetElim1|))

;; Axiom: SetSetElim2
(assert
  (!
    (forall ((smt__a Idv) (smt__s Idv) (smt__i Int))
      (!
        (=>
          (and (smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
            (<= 1 smt__i)
            (<= smt__i (smt__TLA____Proj__Int (smt__TLA____Len smt__s))))
          (smt__TLA____Mem
            (smt__TLA____FunApp smt__s (smt__TLA____Cast__Int smt__i)) 
            smt__a))
        :pattern ((smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
                   (smt__TLA____FunApp smt__s (smt__TLA____Cast__Int smt__i)))))
    :named |SetSetElim2|))

;; Axiom: SeqLenDef
(assert
  (!
    (forall ((smt__s Idv) (smt__z Int))
      (=>
        (and (>= smt__z 0)
          (= (smt__TLA____FunDom smt__s)
            (smt__TLA____IntRange (smt__TLA____Cast__Int 1)
              (smt__TLA____Cast__Int smt__z))))
        (= (smt__TLA____Len smt__s) (smt__TLA____Cast__Int smt__z))))
    :named |SeqLenDef|))

;; Axiom: SeqCatTyping
(assert
  (!
    (forall ((smt__a Idv) (smt__s Idv) (smt__t Idv))
      (!
        (=>
          (and (smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
            (smt__TLA____Mem smt__t (smt__TLA____Seq smt__a)))
          (smt__TLA____Mem (smt__TLA____Cat smt__s smt__t)
            (smt__TLA____Seq smt__a)))
        :pattern ((smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
                   (smt__TLA____Cat smt__s smt__t))
        :pattern ((smt__TLA____Mem smt__t (smt__TLA____Seq smt__a))
                   (smt__TLA____Cat smt__s smt__t)))) :named |SeqCatTyping|))

;; Axiom: SeqCatLen
(assert
  (!
    (forall ((smt__s Idv) (smt__t Idv))
      (!
        (=>
          (and (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
            (smt__TLA____Mem (smt__TLA____Len smt__t) smt__TLA____NatSet))
          (= (smt__TLA____Len (smt__TLA____Cat smt__s smt__t))
            (smt__TLA____Cast__Int
              (+ (smt__TLA____Proj__Int (smt__TLA____Len smt__s))
                (smt__TLA____Proj__Int (smt__TLA____Len smt__t))))))
        :pattern ((smt__TLA____Cat smt__s smt__t)))) :named |SeqCatLen|))

;; Axiom: SeqCatApp1
(assert
  (!
    (forall ((smt__s Idv) (smt__t Idv) (smt__i Int))
      (!
        (=>
          (and (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
            (smt__TLA____Mem (smt__TLA____Len smt__t) smt__TLA____NatSet)
            (<= 1 smt__i)
            (<= smt__i (smt__TLA____Proj__Int (smt__TLA____Len smt__s))))
          (=
            (smt__TLA____FunApp (smt__TLA____Cat smt__s smt__t)
              (smt__TLA____Cast__Int smt__i))
            (smt__TLA____FunApp smt__s (smt__TLA____Cast__Int smt__i))))
        :pattern ((smt__TLA____FunApp (smt__TLA____Cat smt__s smt__t)
                    (smt__TLA____Cast__Int smt__i)))
        :pattern ((smt__TLA____Cat smt__s smt__t)
                   (smt__TLA____FunApp smt__s (smt__TLA____Cast__Int smt__i)))))
    :named |SeqCatApp1|))

;; Axiom: SeqCatApp2
(assert
  (!
    (forall ((smt__s Idv) (smt__t Idv) (smt__i Int))
      (!
        (=>
          (and (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
            (smt__TLA____Mem (smt__TLA____Len smt__t) smt__TLA____NatSet)
            (<= smt__i
              (+ (smt__TLA____Proj__Int (smt__TLA____Len smt__s))
                (smt__TLA____Proj__Int (smt__TLA____Len smt__t))))
            (< (smt__TLA____Proj__Int (smt__TLA____Len smt__s)) smt__i))
          (=
            (smt__TLA____FunApp (smt__TLA____Cat smt__s smt__t)
              (smt__TLA____Cast__Int smt__i))
            (smt__TLA____FunApp smt__t
              (smt__TLA____Cast__Int
                (- smt__i (smt__TLA____Proj__Int (smt__TLA____Len smt__s)))))))
        :pattern ((smt__TLA____FunApp (smt__TLA____Cat smt__s smt__t)
                    (smt__TLA____Cast__Int smt__i))))) :named |SeqCatApp2|))

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

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__s__ () Idv)

(declare-fun smt__CONSTANT__t__ () Idv)

;; Goal
(assert
  (!
    (not
      (=>
        (and
          (smt__TLA____Mem smt__CONSTANT__s__
            (smt__TLA____Seq smt__CONSTANT__S__))
          (smt__TLA____Mem smt__CONSTANT__t__
            (smt__TLA____Seq smt__CONSTANT__S__)))
        (=
          (smt__TLA____Len
            (smt__TLA____Cat smt__CONSTANT__s__ smt__CONSTANT__t__))
          (smt__TLA____IntPlus (smt__TLA____Len smt__CONSTANT__s__)
            (smt__TLA____Len smt__CONSTANT__t__))))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
