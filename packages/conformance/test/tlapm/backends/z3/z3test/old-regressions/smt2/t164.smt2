(*---
description: z3test's regression old-regressions/smt2/t164.smt2.
ref: old-regressions/smt2/t164.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-fun f (Int Int) Int)
(declare-fun p (Int) Bool)
(set-option :pp.max-depth 100)
(push)
(assert (forall ((x1 Int) (x2 Int) (x3 Int) (x4 Int) (x5 Int))
                (=> (= x5 (f x1 x2)) (p (f x5 (f x3 x4))))))  
(apply (and-then (! simplify :elim-and true) der))
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (forall ((x1 Int) (x2 Int) (x3 Int) (x4 Int)) (p (f (f x1 x2) (f x3 x4))))
      :precision precise :depth 2)
    )
---*)
