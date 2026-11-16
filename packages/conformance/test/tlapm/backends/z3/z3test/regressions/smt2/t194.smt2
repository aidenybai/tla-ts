(*---
description: z3test's regression regressions/smt2/t194.smt2.
ref: regressions/smt2/t194.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :produce-proofs true)
(set-option :pp.max-depth 100)
(declare-fun p (Int) Bool)
(declare-fun f (Int Real) Bool)

(push)
(assert (= (p 0) (and (p 1) (p 2))))
(assert (implies (p 3) (p 4)))
(assert (xor (p 5) (and (p 6) (p 7))))
(apply nnf)
(pop)

(echo "----")

(push)
(assert (ite (and (p 0) (p 1)) (p 2) (p 3)))
(apply nnf)
(pop)

(echo "----")
(push)
(assert (p (ite (p 1) 10 20)))
(apply nnf)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (or (not (p 0)) (and (p 1) (p 2)))
      (or (not (p 3)) (p 4))
      (or (p 5) (and (p 6) (p 7)))
      (or (p 0) (not (p 1)) (not (p 2)))
      (or (not (p 5)) (not (p 6)) (not (p 7)))
      :precision precise :depth 1)
    )
    ----
    (goals
    (goal
      (or (not (p 0)) (not (p 1)) (p 2))
      (or (and (p 0) (p 1)) (p 3))
      :precision precise :depth 1)
    )
    ----
    (goals
    (goal
      (p z3name!0)
      (or (not (p 1)) (= z3name!0 10))
      (or (p 1) (= z3name!0 20))
      :precision precise :depth 1)
    )
---*)
