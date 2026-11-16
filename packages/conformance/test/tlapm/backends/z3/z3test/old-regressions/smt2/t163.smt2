(*---
description: z3test's regression old-regressions/smt2/t163.smt2.
ref: old-regressions/smt2/t163.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-fun f (Int Int) Int)
(declare-fun p (Int) Bool)
(set-option :pp.max-depth 100)
(push)
(assert (or (forall ((x Int)) (=> (= x 10) (p x)))
            (= (forall ((x1 Int) (x2 Int)) (=> (= x1 (+ x2 1)) (p x1)))
               (p 20))))
(apply (and-then (! simplify :elim-and true) der))
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (or (p 10) (= (forall ((x2 Int)) (p (+ 1 x2))) (p 20)))
      :precision precise :depth 2)
    )
---*)
