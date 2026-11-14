(*---
description: z3test's regression regressions/smt2/t192.smt2.
ref: regressions/smt2/t192.smt2
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
(assert (q 10 (! (p 0) :lblpos foo :lblneg tst)))
(apply snf)
(echo "-----")
(pop)


(push)
(assert (q 10 (and (! (p 0) :lblpos foo) (! (p 1) :lblneg tst))))
(apply snf)
(echo "-----")
(apply nnf)
(echo "-----")
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (q 10 z3name!0)
      (or (not z3name!0) (and (p 0) (! true :lblpos foo)))
      (or z3name!0 (and (not (p 0)) (! true :lblpos tst)))
      :precision precise :depth 1)
    )
    -----
    (goals
    (goal
      (q 10 (and z3name!1 z3name!2))
      (or (not z3name!2) (p 1))
      (or z3name!2 (and (not (p 1)) (! true :lblpos tst)))
      (or (not z3name!1) (and (p 0) (! true :lblpos foo)))
      (or z3name!1 (not (p 0)))
      :precision precise :depth 1)
    )
    -----
    (goals
    (goal
      (q 10 z3name!3)
      (or (not z3name!3) (and (p 0) (! true :lblpos foo) (p 1)))
      (or z3name!3 (not (p 0)) (and (not (p 1)) (! true :lblpos tst)))
      :precision precise :depth 1)
    )
    -----
---*)
