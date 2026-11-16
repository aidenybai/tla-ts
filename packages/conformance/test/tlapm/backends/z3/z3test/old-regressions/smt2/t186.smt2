(*---
description: z3test's regression old-regressions/smt2/t186.smt2.
ref: old-regressions/smt2/t186.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :pp.max-depth 100)
(declare-fun p (Int) Bool)
(declare-fun f (Int Real) Bool)
(declare-fun q (Int Bool) Bool)

(push)
(assert (or (= (p 10) (p 11)) (q 10 (forall ((x Int)) (f x 2.0)))))
(apply nnf)
(echo "----")
(apply snf)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (or (and (or (not (p 10)) (p 11)) (or (p 10) (not (p 11)))) (q 10 z3name!0))
      (or (not z3name!0) (forall ((x Int)) (f x 2.0)))
      (or z3name!0 (not (f x!1 2.0)))
      :precision precise :depth 1)
    )
    ----
    (goals
    (goal
      (or (= (p 10) (p 11)) (q 10 z3name!2))
      (or (not z3name!2) (forall ((x Int)) (f x 2.0)))
      (or z3name!2 (not (f x!3 2.0)))
      :precision precise :depth 1)
    )
---*)
