(*---
description: z3test's regression regressions/smt2/t123.smt2.
ref: regressions/smt2/t123.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :parser.ignore-bad-patterns false)

(declare-fun f (Int Int) Int)
(declare-fun a () Int)

(display (forall ((x Int) (y Int))
                 (! (= (f x y) x)
                    :pattern ((f x y)))))

(display (forall ((x Int) (y Int))
                 (! (= (f x y) x)
                    :pattern (f x y))))

(display (forall ((x Int) (y Int))
                 (! (= (f x y) x)
                    :pattern ((f x y) (f y x)))))

(display (forall ((x Int) (y Int))
                 (! (= (f x y) x)
                    :pattern x)))

(display (forall ((x Int) (y Int))
                 (! (= (f x y) x)
                    :pattern a)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (forall ((x Int) (y Int)) (! (= (f x y) x) :pattern ((f x y))))
    (forall ((x Int) (y Int)) (! (= (f x y) x) :pattern ((f x y))))
    (forall ((x Int) (y Int)) (! (= (f x y) x) :pattern ((f x y) (f y x))))
    (error "line 22 column 29: invalid pattern, '(' expected")
    (error "line 26 column 29: invalid pattern, '(' expected")
---*)
