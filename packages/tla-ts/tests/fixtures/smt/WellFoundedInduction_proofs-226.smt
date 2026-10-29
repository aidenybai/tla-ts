;; Proof obligation:
;;	ASSUME NEW CONSTANT CONSTANT_Def_(_, _),
;;	       NEW CONSTANT CONSTANT_R_,
;;	       NEW CONSTANT CONSTANT_S_,
;;	       NEW CONSTANT CONSTANT_f_,
;;	       CONSTANT_IsWellFoundedOn_(CONSTANT_R_, CONSTANT_S_) ,
;;	       CONSTANT_WFDefOn_(CONSTANT_R_, CONSTANT_S_, CONSTANT_Def_) ,
;;	       CONSTANT_OpDefinesFcn_(CONSTANT_f_, CONSTANT_S_, CONSTANT_Def_) ,
;;	       CONSTANT_IsTransitivelyClosedOn_(CONSTANT_TransitiveClosureOn_
;;	                                          (CONSTANT_R_, CONSTANT_S_),
;;	                                        CONSTANT_S_) ,
;;	       CONSTANT_IsWellFoundedOn_(CONSTANT_TransitiveClosureOn_(CONSTANT_R_,
;;	                                                               CONSTANT_S_),
;;	                                 CONSTANT_S_) ,
;;	       CONSTANT_WFDefOn_(CONSTANT_TransitiveClosureOn_(CONSTANT_R_,
;;	                                                       CONSTANT_S_),
;;	                         CONSTANT_S_, CONSTANT_Def_) ,
;;	       ASSUME NEW CONSTANT CONSTANT_Def__1(_, _),
;;	              NEW CONSTANT CONSTANT_R__1,
;;	              NEW CONSTANT CONSTANT_S__1,
;;	              NEW CONSTANT CONSTANT_f__1,
;;	              CONSTANT_IsWellFoundedOn_(CONSTANT_R__1, CONSTANT_S__1) ,
;;	              CONSTANT_IsTransitivelyClosedOn_(CONSTANT_R__1, CONSTANT_S__1) ,
;;	              CONSTANT_WFDefOn_(CONSTANT_R__1, CONSTANT_S__1,
;;	                                CONSTANT_Def__1) ,
;;	              CONSTANT_OpDefinesFcn_(CONSTANT_f__1, CONSTANT_S__1,
;;	                                     CONSTANT_Def__1) 
;;	       PROVE  CONSTANT_WFInductiveDefines_(CONSTANT_f__1, CONSTANT_S__1,
;;	                                           CONSTANT_Def__1) 
;;	PROVE  CONSTANT_WFInductiveDefines_(CONSTANT_f_, CONSTANT_S_, CONSTANT_Def_)
;; TLA+ Proof Manager 62e7a03
;; Proof obligation #226
;; Generated from file "./WellFoundedInduction_proofs.tla", line 465, characters 2-3

(set-logic UFNIA)

;; Sorts

(declare-sort Idv 0)

;; Hypotheses

(declare-fun smt__TLA____Tt__Idv () Idv)

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

(declare-fun smt__CONSTANT__IsTransitivelyClosedOn__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__IsWellFoundedOn__ (Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__SetLessThan__ (Idv Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; omitted declaration of 'CONSTANT_WFDefOn_' (second-order)

; omitted declaration of 'CONSTANT_OpDefinesFcn_' (second-order)

; omitted declaration of 'CONSTANT_WFInductiveDefines_' (second-order)

; omitted declaration of 'CONSTANT_WFInductiveUnique_' (second-order)

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__TransitiveClosureOn__ (Idv Idv) Idv)

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

; hidden fact

(declare-fun smt__CONSTANT__Def__ (Idv Idv) Idv)

(declare-fun smt__CONSTANT__R__ () Idv)

(declare-fun smt__CONSTANT__S__ () Idv)

(declare-fun smt__CONSTANT__f__ () Idv)

(assert
  (= (smt__CONSTANT__IsWellFoundedOn__ smt__CONSTANT__R__ smt__CONSTANT__S__)
    smt__TLA____Tt__Idv))

(declare-fun smt__CONSTANT__WFDefOn____flatnd__1 (Idv Idv) Idv)

(assert
  (=
    (smt__CONSTANT__WFDefOn____flatnd__1 smt__CONSTANT__R__
      smt__CONSTANT__S__) smt__TLA____Tt__Idv))

(declare-fun smt__CONSTANT__OpDefinesFcn____flatnd__2 (Idv Idv) Idv)

(assert
  (=
    (smt__CONSTANT__OpDefinesFcn____flatnd__2 smt__CONSTANT__f__
      smt__CONSTANT__S__) smt__TLA____Tt__Idv))

; hidden fact

; hidden fact

; hidden fact

(assert
  (=
    (smt__CONSTANT__IsTransitivelyClosedOn__
      (smt__CONSTANT__TransitiveClosureOn__ smt__CONSTANT__R__
        smt__CONSTANT__S__) smt__CONSTANT__S__) smt__TLA____Tt__Idv))

(assert
  (=
    (smt__CONSTANT__IsWellFoundedOn__
      (smt__CONSTANT__TransitiveClosureOn__ smt__CONSTANT__R__
        smt__CONSTANT__S__) smt__CONSTANT__S__) smt__TLA____Tt__Idv))

(assert
  (=
    (smt__CONSTANT__WFDefOn____flatnd__1
      (smt__CONSTANT__TransitiveClosureOn__ smt__CONSTANT__R__
        smt__CONSTANT__S__) smt__CONSTANT__S__) smt__TLA____Tt__Idv))

; omitted fact (second-order)

(declare-fun smt__CONSTANT__WFInductiveDefines____flatnd__4 (Idv Idv) Idv)

;; Goal
(assert
  (!
    (not
      (=
        (smt__CONSTANT__WFInductiveDefines____flatnd__4 smt__CONSTANT__f__
          smt__CONSTANT__S__) smt__TLA____Tt__Idv)) :named |Goal|))

(check-sat)
(exit)
