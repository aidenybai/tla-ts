(*---
description: z3test's regression old-regressions/smt2/triggers.smt2.
ref: old-regressions/smt2/triggers.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
; (set-option :print-success false)
; (set-info :smt-lib-version 2.0)
(set-option :auto-config false)
(set-option :smt.mbqi false)
(set-option :smt.qi.eager-threshold 100)
(set-option :type-check true)

(declare-sort |T@U| 0)
(declare-sort |T@T| 0)
(declare-fun int_div (Int Int) Int)
(declare-fun int_mod (Int Int) Int)
(declare-fun UOrdering2 (|T@U| |T@U|) Bool)
(declare-fun UOrdering3 (|T@T| |T@U| |T@U|) Bool)
(declare-fun tickleBool (Bool) Bool)
(assert (and (tickleBool true) (tickleBool false)))

(declare-fun Ctor (T@T) Int)
(declare-fun intType () T@T)
(declare-fun boolType () T@T)
(declare-fun int_2_U (Int) T@U)
(declare-fun U_2_int (T@U) Int)
(declare-fun type (T@U) T@T)
(declare-fun bool_2_U (Bool) T@U)
(declare-fun U_2_bool (T@U) Bool)
(declare-fun HeapTypeType () T@T)
(declare-fun refType () T@T)
(declare-fun vals1 (T@U T@U) T@U)
(declare-fun vals3 (T@U T@U) T@U)
(declare-fun vals2 (T@U T@U) T@U)
(declare-fun trigger2 (T@U) Bool)
(declare-fun trigger1 (T@U) Bool)
(declare-fun heap_trigger (T@U) Bool)
(declare-fun this@@2 () T@U)
(declare-fun Heap@@2 () T@U)
(declare-fun %lbl%+167 () Bool)
(declare-fun %lbl%@242 () Bool)
(declare-fun %lbl%+224 () Bool)
(assert (and
(= (Ctor HeapTypeType) 2)
(= (Ctor refType) 3)
(forall ((arg0@@3 T@U) (arg1 T@U) ) (! (= (type (vals1 arg0@@3 arg1)) refType)
 :qid |funType:vals1|
 :pattern ( (vals1 arg0@@3 arg1))
))
(forall ((arg0@@4 T@U) (arg1@@0 T@U) ) (! (= (type (vals3 arg0@@4 arg1@@0)) refType)
 :qid |funType:vals3|
 :pattern ( (vals3 arg0@@4 arg1@@0))
))))
(assert (forall ((Heap T@U) (this T@U) ) (! (=> (and
(= (type Heap) HeapTypeType)
(= (type this) refType)) (= (vals1 Heap this) (vals3 Heap this)))
 :qid |triggers.13:15|
 :skolemid |0|
 :pattern ( (vals1 Heap this))
)))
(assert (forall ((arg0@@5 T@U) (arg1@@1 T@U) ) (! (= (type (vals2 arg0@@5 arg1@@1)) refType)
 :qid |funType:vals2|
 :pattern ( (vals2 arg0@@5 arg1@@1))
)))
(assert (forall ((Heap@@0 T@U) (this@@0 T@U) ) (! (=> (and
(= (type Heap@@0) HeapTypeType)
(= (type this@@0) refType)) (trigger2 this@@0))
 :qid |triggers.15:15|
 :skolemid |1|
 :pattern ( (vals2 Heap@@0 this@@0))
)))
(assert (forall ((Heap@@1 T@U) (this@@1 T@U) ) (! (=> (and
(= (type Heap@@1) HeapTypeType)
(= (type this@@1) refType)) (= (vals1 Heap@@1 this@@1) (vals2 Heap@@1 this@@1)))
 :qid |triggers.18:15|
 :skolemid |2|
 :pattern ( (vals1 Heap@@1 this@@1))
 :pattern ( (trigger1 this@@1) (heap_trigger Heap@@1) (trigger2 this@@1))
; :pattern ( (heap_trigger Heap@@1) (trigger2 this@@1))
; :pattern ( (trigger1 this@@1) (heap_trigger Heap@@1) )
)))
(assert (and
(= (type this@@2) refType)
(= (type Heap@@2) HeapTypeType)))
(push)
(assert (not
(let ((anon0_correct (=> (! (and %lbl%+167 true) :lblpos +167) (=> (and
(trigger1 this@@2)
(heap_trigger Heap@@2)) (and
(! (or %lbl%@242 (= (vals2 Heap@@2 this@@2) (vals3 Heap@@2 this@@2))) :lblneg @242)
(=> (= (vals2 Heap@@2 this@@2) (vals3 Heap@@2 this@@2)) true))))))
(let ((PreconditionGeneratedEntry_correct (=> (! (and %lbl%+224 true) :lblpos +224) anon0_correct)))
PreconditionGeneratedEntry_correct))
))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
