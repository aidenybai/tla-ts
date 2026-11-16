(*---
description: >-
  tlapm encodes a two-argument function as a function on a product whose body is an SMT let, but the
  let binds the wrong terms and applies the bound variable smt__x instead of F, so Z3 rejects the
  FunAppDef axiom as ill-sorted and drops it. With the other axioms removed, Z3 then finds the goal
  satisfiable. The bad indices come from src/encode/n_rewrite.ml#elim_multiarg.
ref: src/encode/n_rewrite.ml#elim_multiarg
outcome: sat
features:
  - tlapm-bug
---*)
;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_T_,
;;	       NEW CONSTANT CONSTANT_x_,
;;	       NEW CONSTANT CONSTANT_y_,
;;	       NEW CONSTANT CONSTANT_F_(_, _)
;;	PROVE  CONSTANT_x_ \in CONSTANT_S_ /\ CONSTANT_y_ \in CONSTANT_T_
;;	       => [CONSTANT_a_ \in CONSTANT_S_, CONSTANT_b_ \in CONSTANT_T_ |->
;;	             CONSTANT_F_(CONSTANT_a_, CONSTANT_b_)][CONSTANT_x_, CONSTANT_y_]
;;	          = CONSTANT_F_(CONSTANT_x_, CONSTANT_y_)
;; TLA+ Proof Manager b91fb6c
;; Proof obligation #1
;; Generated from file "./G.tla", line 5, characters 3-4

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Cast__Int (Int) Idv)

(declare-fun smt__TLA____FunApp (Idv Idv) Idv)

(declare-fun smt__TLA____FunDom (Idv) Idv)

; omitted declaration of 'TLA__FunFcn' (second-order)

(declare-fun smt__TLA____FunIsafcn (Idv) Bool)

(declare-fun smt__TLA____IntLit__0 () Idv)

(declare-fun smt__TLA____IntLit__1 () Idv)

(declare-fun smt__TLA____IntLit__2 () Idv)

(declare-fun smt__TLA____IntLteq (Idv Idv) Bool)

(declare-fun smt__TLA____IntRange (Idv Idv) Idv)

(declare-fun smt__TLA____IntSet () Idv)

(declare-fun smt__TLA____Len (Idv) Idv)

(declare-fun smt__TLA____Mem (Idv Idv) Bool)

(declare-fun smt__TLA____NatSet () Idv)

(declare-fun smt__TLA____Product__2 (Idv Idv) Idv)

(declare-fun smt__TLA____Proj__Int (Idv) Int)

(declare-fun smt__TLA____Seq (Idv) Idv)

(declare-fun smt__TLA____SetEnum__2 (Idv Idv) Idv)

(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)

(declare-fun smt__TLA____Tuple__2 (Idv Idv) Idv)

; omitted fact (second-order)

; omitted fact (second-order)

; omitted fact (second-order)

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)

; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__T__ () Idv)

(declare-fun smt__CONSTANT__x__ () Idv)

(declare-fun smt__CONSTANT__y__ () Idv)

(declare-fun smt__CONSTANT__F__ (Idv Idv) Idv)

(declare-fun smt__TLA____FunFcn__flatnd__1 (Idv) Idv)

;; Axiom: FunAppDef TLA__FunFcn_flatnd_1
(assert
  (!
    (forall ((smt__a Idv) (smt__x Idv))
      (!
        (=> (smt__TLA____Mem smt__x smt__a)
          (=
            (smt__TLA____FunApp (smt__TLA____FunFcn__flatnd__1 smt__a) smt__x)
            (let ((smt__CONSTANT__b__ (smt__TLA____Cast__Int smt__x
                                        smt__TLA____IntLit__1))
                   (smt__CONSTANT__a__ (smt__TLA____FunApp smt__x
                                         smt__TLA____IntLit__1)))
              (smt__x smt__CONSTANT__a__ smt__CONSTANT__b__))))
        :pattern ((smt__TLA____FunApp (smt__TLA____FunFcn__flatnd__1 smt__a)
                    smt__x))
        :pattern ((smt__TLA____Mem smt__x smt__a)
                   (smt__TLA____FunFcn__flatnd__1 smt__a))))
    :named |FunAppDef TLA__FunFcn_flatnd_1|))

;; Goal
(assert
  (!
    (not
      (=>
        (and (smt__TLA____Mem smt__CONSTANT__x__ smt__CONSTANT__S__)
          (smt__TLA____Mem smt__CONSTANT__y__ smt__CONSTANT__T__))
        (=
          (smt__TLA____FunApp
            (smt__TLA____FunFcn__flatnd__1
              (smt__TLA____Product__2 smt__CONSTANT__S__ smt__CONSTANT__T__))
            (smt__TLA____Tuple__2 smt__CONSTANT__x__ smt__CONSTANT__y__))
          (smt__CONSTANT__F__ smt__CONSTANT__x__ smt__CONSTANT__y__))))
    :named |Goal|))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
