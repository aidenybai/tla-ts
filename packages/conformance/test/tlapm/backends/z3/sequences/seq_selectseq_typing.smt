(*---
description: Z3 proves SelectSeq(s, Test) \in Seq(S) through SeqSelectseqTyping.
ref: src/encode/n_axioms.ml#seqselectseq_typing
outcome: unsat
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_s_,
;;	       NEW CONSTANT CONSTANT_Test_(_)
;;	PROVE  CONSTANT_s_ \in Seq(CONSTANT_S_)
;;	       => SelectSeq(CONSTANT_s_, CONSTANT_Test_) \in Seq(CONSTANT_S_)
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Append (Idv Idv) Idv)

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Len (Idv) Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

; omitted declaration of 'TLA__SelectSeq' (second-order)

(declare-fun smt__TLA____Seq (Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____Tt__Idv () Idv)

(declare-fun smt__TLA____Tuple__0 () Idv)

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

;; Axiom: SeqAppendTyping
(assert
  (!
    (forall ((smt__a Idv) (smt__s Idv) (smt__x Idv))
      (!
        (=>
          (and (smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
            (smt__TLA____Mem smt__x smt__a))
          (smt__TLA____Mem (smt__TLA____Append smt__s smt__x)
            (smt__TLA____Seq smt__a)))
        :pattern ((smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
                   (smt__TLA____Append smt__s smt__x))))
    :named |SeqAppendTyping|))

;; Axiom: SeqAppendLen
(assert
  (!
    (forall ((smt__s Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
          (= (smt__TLA____Len (smt__TLA____Append smt__s smt__x))
            (smt__TLA____Cast__Int
              (+ (smt__TLA____Proj__Int (smt__TLA____Len smt__s)) 1))))
        :pattern ((smt__TLA____Append smt__s smt__x)))) :named |SeqAppendLen|))

;; Axiom: SeqAppendApp1
(assert
  (!
    (forall ((smt__s Idv) (smt__x Idv) (smt__i Int))
      (!
        (=>
          (and (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
            (<= 1 smt__i)
            (<= smt__i (smt__TLA____Proj__Int (smt__TLA____Len smt__s))))
          (=
            (smt__TLA____FunApp (smt__TLA____Append smt__s smt__x)
              (smt__TLA____Cast__Int smt__i))
            (smt__TLA____FunApp smt__s (smt__TLA____Cast__Int smt__i))))
        :pattern ((smt__TLA____FunApp (smt__TLA____Append smt__s smt__x)
                    (smt__TLA____Cast__Int smt__i)))
        :pattern ((smt__TLA____Append smt__s smt__x)
                   (smt__TLA____FunApp smt__s (smt__TLA____Cast__Int smt__i)))))
    :named |SeqAppendApp1|))

;; Axiom: SeqAppendApp2
(assert
  (!
    (forall ((smt__s Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
          (=
            (smt__TLA____FunApp (smt__TLA____Append smt__s smt__x)
              (smt__TLA____Cast__Int
                (+ (smt__TLA____Proj__Int (smt__TLA____Len smt__s)) 1)))
            smt__x)) :pattern ((smt__TLA____Append smt__s smt__x))))
    :named |SeqAppendApp2|))

; omitted fact (second-order)

; omitted fact (second-order)

; omitted fact (second-order)

; omitted fact (second-order)

; omitted fact (second-order)

;; Axiom: TupIsafcn 0
(assert (! (smt__TLA____FunIsafcn smt__TLA____Tuple__0) :named |TupIsafcn 0|))

;; Axiom: SeqTupTyping 0
(assert
  (!
    (forall ((smt__a Idv))
      (! (smt__TLA____Mem smt__TLA____Tuple__0 (smt__TLA____Seq smt__a))
        :pattern (smt__TLA____Tuple__0))) :named |SeqTupTyping 0|))

;; Axiom: SeqTupLen 0
(assert
  (! (= (smt__TLA____Len smt__TLA____Tuple__0) (smt__TLA____Cast__Int 0))
    :named |SeqTupLen 0|))

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

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__s__ () Idv)

(declare-fun smt__CONSTANT__Test__ (Idv) Idv)

(declare-fun smt__TLA____SelectSeq__flatnd__1 (Idv) Idv)

;; Axiom: SeqSelectseqTyping TLA__SelectSeq_flatnd_1
(assert
  (!
    (forall ((smt__a Idv) (smt__s Idv))
      (!
        (=> (smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
          (smt__TLA____Mem (smt__TLA____SelectSeq__flatnd__1 smt__s)
            (smt__TLA____Seq smt__a)))
        :pattern ((smt__TLA____Mem smt__s (smt__TLA____Seq smt__a))
                   (smt__TLA____SelectSeq__flatnd__1 smt__s))))
    :named |SeqSelectseqTyping TLA__SelectSeq_flatnd_1|))

;; Axiom: SeqSelectseqLen TLA__SelectSeq_flatnd_1
(assert
  (!
    (forall ((smt__s Idv))
      (!
        (=> (smt__TLA____Mem (smt__TLA____Len smt__s) smt__TLA____NatSet)
          (<=
            (smt__TLA____Proj__Int
              (smt__TLA____Len (smt__TLA____SelectSeq__flatnd__1 smt__s)))
            (smt__TLA____Proj__Int (smt__TLA____Len smt__s))))
        :pattern ((smt__TLA____SelectSeq__flatnd__1 smt__s))))
    :named |SeqSelectseqLen TLA__SelectSeq_flatnd_1|))

;; Axiom: SeqSelectseqNil TLA__SelectSeq_flatnd_1
(assert
  (!
    (= (smt__TLA____SelectSeq__flatnd__1 smt__TLA____Tuple__0)
      smt__TLA____Tuple__0) :named |SeqSelectseqNil TLA__SelectSeq_flatnd_1|))

;; Axiom: SeqSelectseqApp TLA__SelectSeq_flatnd_1
(assert
  (!
    (forall ((smt__s Idv) (smt__x Idv))
      (!
        (=>
          (smt__TLA____Mem smt__x
            (smt__TLA____FunDom (smt__TLA____SelectSeq__flatnd__1 smt__s)))
          (=
            (smt__CONSTANT__Test__
              (smt__TLA____FunApp (smt__TLA____SelectSeq__flatnd__1 smt__s)
                smt__x)) smt__TLA____Tt__Idv))
        :pattern ((smt__TLA____FunApp
                    (smt__TLA____SelectSeq__flatnd__1 smt__s) smt__x))))
    :named |SeqSelectseqApp TLA__SelectSeq_flatnd_1|))

;; Axiom: SeqSelectseqAppend TLA__SelectSeq_flatnd_1
(assert
  (!
    (forall ((smt__s Idv) (smt__x Idv))
      (!
        (and
          (=> (= (smt__CONSTANT__Test__ smt__x) smt__TLA____Tt__Idv)
            (=
              (smt__TLA____SelectSeq__flatnd__1
                (smt__TLA____Append smt__s smt__x))
              (smt__TLA____Append (smt__TLA____SelectSeq__flatnd__1 smt__s)
                smt__x)))
          (=> (not (= (smt__CONSTANT__Test__ smt__x) smt__TLA____Tt__Idv))
            (=
              (smt__TLA____SelectSeq__flatnd__1
                (smt__TLA____Append smt__s smt__x))
              (smt__TLA____SelectSeq__flatnd__1 smt__s))))
        :pattern ((smt__TLA____SelectSeq__flatnd__1
                    (smt__TLA____Append smt__s smt__x)))))
    :named |SeqSelectseqAppend TLA__SelectSeq_flatnd_1|))

;; Goal
(assert
  (!
    (not
      (=>
        (smt__TLA____Mem smt__CONSTANT__s__
          (smt__TLA____Seq smt__CONSTANT__S__))
        (smt__TLA____Mem
          (smt__TLA____SelectSeq__flatnd__1 smt__CONSTANT__s__)
          (smt__TLA____Seq smt__CONSTANT__S__)))) :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
