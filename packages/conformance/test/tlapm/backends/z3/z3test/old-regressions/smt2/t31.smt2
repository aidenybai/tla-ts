(*---
description: z3test's regression old-regressions/smt2/t31.smt2.
ref: old-regressions/smt2/t31.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-fun a () (Array Int Int))
(declare-fun b () (Array Int Int))
(declare-fun c () (Array Int Int))
(declare-fun a1 () (Array Int Int))
(declare-fun b1 () (Array Int Int))
(declare-fun c1 () (Array Int Int))
(declare-fun a2 () (Array Int Int))
(declare-fun b2 () (Array Int Int))
(declare-fun c2 () (Array Int Int))
(declare-fun a3 () (Array Int Int))
(declare-fun b3 () (Array Int Int))
(declare-fun c3 () (Array Int Int))
(declare-fun a4 () (Array Int Int))
(declare-fun b4 () (Array Int Int))
(declare-fun c4 () (Array Int Int))
(declare-fun i () Int)
(declare-fun j () Int)
(declare-fun k () Int)
(declare-fun i1 () Int)
(declare-fun j1 () Int)
(declare-fun i2 () Int)
(declare-fun j2 () Int)
(declare-fun i3 () Int)
(declare-fun j3 () Int)
(declare-fun i4 () Int)
(declare-fun j4 () Int)
(declare-fun v () Int)
(declare-fun w () Int)
(declare-fun u () Int)
(declare-fun v1 () Int)
(declare-fun w1 () Int)
(declare-fun u1 () Int)
(declare-fun v2 () Int)
(declare-fun w2 () Int)
(declare-fun u2 () Int)
(declare-fun v3 () Int)
(declare-fun w3 () Int)
(declare-fun u3 () Int)

(push)
(assert (and 
         (= (store a i v) b) 
         (= (store a j w) c) 
         (= (select b j) w) 
         (= (select c i) v) 
         (not (= b c)))
        )
(check-sat)
(pop)

(push)
(assert (and 
	;(= a2 (store a1 i1 v1)) 
	;(= a3 (store a2 i2 v2)) 
	(= a4 (store a3 i3 v3)) 
	(not (= j i3)) 
	;(not (= j i1)) 
	(not (= (select a4 j) (select a3 j)))))
(check-sat)
(pop)

(push)
(assert (and (= a2 (store a1 i1 v1)) 
	     (= a3 (store a2 i2 v2)) 
	     (= a4 (store a3 i3 v3)) 
	     (not (= j i3)) 
	     (not (= j i2)) 
	     (not (= j i1)) 
	     (not (= (select a4 j) (select a1 j)))))
(check-sat)
(pop)

(push)
(assert (and 
         (= (store a1 i1 w) (store a2 i2 u)) 
         (not (= i1 i3)) 
         (not (= i2 i3)) 
         (not (= (select a1 i3) (select a2 i3)))))
(check-sat)
(pop)


(push)
(assert (and (= (store (store a2 i2 v2) i1 v1) (store a3 i3 v3)) (= i2 i3) (not (= i1 i3)) (not (= v2 v3))))
(check-sat)
(pop)

(push)
(assert (and 
         (= a3 (store a2 i2 v2)) 
         (= a4 (store a3 i3 v3)) 
         (not (= j i3)) 
         (not (= j i2)) 
         (not (= (select a4 j) (select a2 j)))))
(check-sat)
(pop)


(reset)
(set-option :auto-config true)
(declare-fun a () (Array Int Int))
(declare-fun b () (Array Int Int))
(declare-fun c () (Array Int Int))
(declare-fun i () Int)
(declare-fun j () Int)
(declare-fun k () Int)
(declare-fun v () Int)
(declare-fun w () Int)
(declare-fun u () Int)

(assert (and 
         (= (store a i v) b) 
         (= (store a j w) c) 
         (= (select b j) w) 
         (= (select c i) v) 
         (not (= b c)))
        )
(check-sat)

(reset)
(echo "after second reset...")
(check-sat)
(get-option :auto-config)
(declare-fun a3 () (Array Int Int))
(declare-fun a4 () (Array Int Int))
(declare-fun i () Int)
(declare-fun j () Int)
(declare-fun i3 () Int)
(declare-fun v3 () Int)
(assert (and 
	(= a4 (store a3 i3 v3)) 
	(not (= j i3)) 
	(not (= (select a4 j) (select a3 j)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
    unsat
    unsat
    unsat
    unsat
    unsat
    after second reset...
    sat
    true
    unsat
---*)
