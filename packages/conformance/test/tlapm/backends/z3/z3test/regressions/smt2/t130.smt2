(*---
description: z3test's regression regressions/smt2/t130.smt2.
ref: regressions/smt2/t130.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.max-depth 100)

(declare-fun f (Int Int) Int)
(declare-fun p (Int) Bool)
(declare-fun g (Int) Int)

(simplify (forall ((x Int) (y Int))
                  (forall ((w Int) (z Int))
                          (= (f x y) (f x z)))))

(simplify (forall ((x Int) (y Int))
                  (exists ((w Int) (z Int))
                          (= (f x y) (f x z)))))

(simplify (forall ((x Int))
                  (! (= (g x) (f x x))
                     :pattern ((g x))
                     :pattern ((g x))
                     :pattern ((f x x)))))

(simplify (forall ((x Int))
                  (forall ((y Int))
                          (! (= (f x y) 0)
                             :pattern ((f x y))))))

(simplify (exists ((x Int))
                  (exists ((y Int))
                          (= (f x y) 0))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (forall ((x Int) (y Int) (z Int)) (= (f x y) (f x z)))
    (forall ((x Int) (y Int)) (exists ((z Int)) (= (f x y) (f x z))))
    (forall ((x Int)) (! (= (g x) (f x x)) :pattern ((g x)) :pattern ((f x x))))
    (forall ((x Int)) (forall ((y Int)) (! (= (f x y) 0) :pattern ((f x y)))))
    (exists ((x Int) (y Int)) (= (f x y) 0))
---*)
