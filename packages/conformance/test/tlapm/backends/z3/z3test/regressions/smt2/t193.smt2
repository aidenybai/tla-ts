(*---
description: z3test's regression regressions/smt2/t193.smt2.
ref: regressions/smt2/t193.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :pp.max-depth 100)
(declare-fun p (Int) Bool)
(declare-fun f (Int Real) Bool)
(declare-fun q (Int Bool) Bool)
(declare-fun a () Int)

(push)
(assert (= (q 10 (and (forall ((x Int)) (p x)) (p 2))) (p 0)))
(apply snf)
(echo "-----")
(apply nnf)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (or (not (q 10 (and z3name!0 (p 2)))) (p 0))
      (or (q 10 (and z3name!0 (p 2))) (not (p 0)))
      (or (not z3name!0) (forall ((x Int)) (p x)))
      (or z3name!0 (not (p x!1)))
      :precision precise :depth 1)
    )
    -----
    (goals
    (goal
      (or (not (q 10 z3name!2)) (p 0))
      (or (q 10 z3name!2) (not (p 0)))
      (or (not z3name!2) (and (forall ((x Int)) (p x)) (p 2)))
      (or z3name!2 (not (p x!3)) (not (p 2)))
      :precision precise :depth 1)
    )
---*)
