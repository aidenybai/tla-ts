(*---
description: z3test's regression regressions/smt2-debug/t129.smt2.
ref: regressions/smt2-debug/t129.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.max-depth 100)

(dbg-instantiate-nested (forall ((z1 Int) (z2 Real) (z3 Real))
                                (forall ((x Int) (y Real))
                                        (= (+ (to_real x) y) (+ z2 (to_real z1)))))
                        (3 5.0))

(declare-fun p (Int) Bool)

(dbg-instantiate-nested (forall ((z1 Int) (z2 Real))
                                (forall ((x1 Real) (x2 Int) (x3 Int))
                                        (and (p (to_int x1))
                                             (forall ((y1 Int) (y2 Int))
                                                     (or (p y1)
                                                         (p x2)
                                                         (p z1))))))
                        (1.0 2 3))

(dbg-instantiate-nested (forall ((z1 Int) (z2 Int))
                                (forall ((x1 Real) (x2 Int) (x3 Int))
                                        (and (p (to_int x1))
                                             (p z2)
                                             (forall ((y1 Int) (y2 Int))
                                                     (or (p y1)
                                                         (p z1)
                                                         (p z2)
                                                         (exists ((z1 Int))
                                                                 (= (p z1) (p x2))))))))
                        (10.0 20 30))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (= (+ (to_real 3) 5.0) (+ (:var 1) (to_real (:var 2))))
    (and (p (to_int 1.0))
         (forall ((y1 Int) (y2 Int)) (or (p y1) (p 2) (p (:var 3)))))
    (and (p (to_int 10.0))
         (p (:var 0))
         (forall ((y1 Int) (y2 Int))
           (or (p y1)
               (p (:var 3))
               (p (:var 2))
               (exists ((z1 Int)) (= (p z1) (p 20))))))
---*)
