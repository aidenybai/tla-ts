(*---
description: z3test's regression regressions/smt2/t189.smt2.
ref: regressions/smt2/t189.smt2
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
(assert (= (ite (> (ite (p 0) 20 30) a) 0 1) a))
(apply snf)
(echo "----")
(apply nnf)
(echo "----")
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (= (ite (> (ite (p 0) 20 30) a) 0 1) a)
      :precision precise :depth 1)
    )
    ----
    (goals
    (goal
      (= z3name!0 a)
      (or (not (p 0)) (= z3name!1 20))
      (or (p 0) (= z3name!1 30))
      (or (not (> z3name!1 a)) (= z3name!0 0))
      (or (> z3name!1 a) (= z3name!0 1))
      :precision precise :depth 1)
    )
    ----
---*)
