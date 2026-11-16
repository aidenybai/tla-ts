(*---
description: z3test's regression regressions/smt2/t185.smt2.
ref: regressions/smt2/t185.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :pp.max-depth 100)
(declare-fun p (Int) Bool)
(declare-fun f (Int Real) Bool)

(push)
(assert (not (forall ((x Int) (z Real) (z2 Int)) (=> (and (f x z) (f z2 z)) (exists ((y Int)) (and (not (= y x)) (f y z)))))))
(apply nnf)
(pop)


(push)
(assert (not (forall ((x Int) (z Real) (z2 Int)) (! (=> (and (f x z) (f z2 z)) (exists ((y Int)) (and (not (= y x)) (f y z)))) :skolemid foo))))
(apply nnf)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (f x!2 z!1)
      (f z2!0 z!1)
      (forall ((y Int)) (or (= y x!2) (not (f y z!1))))
      :precision precise :depth 1)
    )
    (goals
    (goal
      (f x!foo!5 z!foo!4)
      (f z2!foo!3 z!foo!4)
      (forall ((y Int)) (or (= y x!foo!5) (not (f y z!foo!4))))
      :precision precise :depth 1)
    )
---*)
