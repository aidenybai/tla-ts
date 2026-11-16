(*---
description: z3test's regression regressions/smt2-debug/t128.smt2.
ref: regressions/smt2-debug/t128.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.max-depth 100)

(dbg-instantiate (forall ((x Int) (y Real))
                         (= (+ (to_real x) y) 10.0))
                 (3 5.0))

(dbg-instantiate (forall ((x Int) (y Real))
                         (= (+ (to_real x) y) 10.0))
                 (5.0 3))

(declare-fun p (Int) Bool)

(dbg-instantiate (forall ((x1 Real) (x2 Int) (x3 Int))
                         (and (p (to_int x1))
                              (forall ((y1 Int) (y2 Int))
                                      (or (p y1)
                                          (p x2)))))
                 (1.0 2 3))

(dbg-instantiate (forall ((x Int) (y (Array Int Int)) (z Bool))
                         (= (select y x) (ite z 1 0)))
                 (100 ((as const (Array Int Int)) 0) true))

(dbg-instantiate (forall ((x Int)) (p 10))
                 (10000))

(dbg-instantiate (forall ((x1 Real) (x2 Int) (x3 Int))
                         (and (p (to_int x1))
                              (forall ((y1 Int) (y2 Int))
                                      (or (p y1)
                                          (exists ((z1 Int))
                                                  (= (p z1) (p x2)))))))
                 (10.0 20 30))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (= (+ (to_real 3) 5.0) 10.0)
    (error "line 12 column 24: invalid command, sort mismatch at position 1")
    (and (p (to_int 1.0)) (forall ((y1 Int) (y2 Int)) (or (p y1) (p 2))))
    (= (select ((as const (Array Int Int)) 0) 100) 1)
    (p 10)
    (and (p (to_int 10.0))
         (forall ((y1 Int) (y2 Int))
           (or (p y1) (exists ((z1 Int)) (= (p z1) (p 20))))))
---*)
