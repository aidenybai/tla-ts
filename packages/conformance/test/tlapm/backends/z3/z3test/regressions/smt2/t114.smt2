(*---
description: z3test's regression regressions/smt2/t114.smt2.
ref: regressions/smt2/t114.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const x1 Int)
(declare-const x2 Int)
(declare-const x3 Int)
(declare-const x4 Int)
(declare-fun f (Int) Int)
(declare-fun p (Int) Bool)
(declare-fun q (Int) Bool)

(set-option :pp.max-depth 20)

(assert (or (= x1 0) 
            (= (f x2) (f x1))
            (and (p (f x2)) (= x2 3) (ite (= x1 20)
                                          (or (q (f x2)) (= (f (+ x2 1)) (f x1)))
                                          (or (q (f (f x2))) (q (f x1)))))
            (and (p (f x2)) (>= (f x2) 0))
            (>= (ite (not (= x1 2)) x1 (+ x1 1)) x2)))

(apply (and-then simplify (! ctx-simplify :max-depth 5)))

(apply (and-then simplify (! ctx-simplify :max-depth 7)))

(apply (and-then simplify (! ctx-simplify :max-depth 8)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (or (= x1 0)
          (= (f x2) (f x1))
          (and (p (f x2)) (>= (f x2) 0))
          (and (p (f 3))
               (= x2 3)
               (ite (= x1 20)
                    (or (q (f x2)) (= (f (+ 1 x2)) (f x1)))
                    (or (q (f (f x2))) (q (f x1)))))
          (ite (= x1 2) (>= 3 x2) (>= x1 x2)))
      :precision precise :depth 2)
    )
    (goals
    (goal
      (or (= x1 0)
          (= (f x2) (f x1))
          (and (p (f x2)) (>= (f x2) 0))
          (and (p (f 3))
               (= x2 3)
               (ite (= x1 20)
                    (or (q (f 3)) (= (f (+ 1 x2)) (f 20)))
                    (or (q (f (f x2))) (q (f x1)))))
          (ite (= x1 2) (>= 3 x2) (>= x1 x2)))
      :precision precise :depth 2)
    )
    (goals
    (goal
      (or (= x1 0)
          (= (f x2) (f x1))
          (and (p (f x2)) (>= (f x2) 0))
          (and (p (f 3))
               (= x2 3)
               (ite (= x1 20)
                    (or (q (f 3)) (= (f 4) (f 20)))
                    (or (q (f x1)) (q (f (f 3))))))
          (ite (= x1 2) (>= 3 x2) (>= x1 x2)))
      :precision precise :depth 2)
    )
---*)
