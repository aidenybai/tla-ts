(*---
description: z3test's regression old-regressions/smt2/t30.smt2.
ref: old-regressions/smt2/t30.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



(dbg-lt (forall ((y Int)) (< y 0)) (forall ((x Int)) (! (< x 0) :no-pattern (< x 0))))
(dbg-lt (forall ((x Int)) (! (< x 0) :no-pattern (< x 0))) (forall ((y Int)) (< y 0)))
(dbg-lt (forall ((y Int)) (< y 0)) (forall ((y Int)) (! (< y 0) :weight 20)))
(dbg-lt (forall ((y Int)) (! (< y 0) :weight 30)) (forall ((y Int)) (! (< y 0) :weight 20)))
(declare-const a Int)
(declare-const b Int)
(dbg-lt (forall ((x Int) (y Int)) (> a x)) 
        (forall ((x Int)) (> a x)))
(dbg-lt (forall ((x Int)) (> a x))
        (forall ((x Int) (y Int)) (> a x)))
(dbg-lt (forall ((x Int)) (> a x))
        (forall ((x Int) (y Int)) (> b x)))
(dbg-lt (forall ((x Int)) (> a x))
        (forall ((x Int)) (> b x)))
(dbg-lt (forall ((x Int)) (> a x))
        (forall ((x Int)) (> a x)))
(declare-fun f (Int) Int)
(dbg-lt (forall ((x Int)) (> a x))
        (forall ((x Int)) (> (f a) x)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    false
    true
    false
    false
    true
    true
    true
    false
    true
---*)
