(*---
description: z3test's regression regressions/smt2/t191.smt2.
ref: regressions/smt2/t191.smt2
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
(assert (! (p 0) :lblpos foo :lblpos baa :lblneg tst :lblneg tst2))
(apply snf)
(echo "-----")
(pop)


(push)
(assert (not (! (p 0) :lblpos foo :lblpos baa :lblneg tst :lblneg tst2)))
(apply snf)
(echo "-----")
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (p 0)
      (! true :lblpos foo)
      (! true :lblpos baa)
      :precision precise :depth 1)
    )
    -----
    (goals
    (goal
      (not (p 0))
      (! true :lblpos tst)
      (! true :lblpos tst2)
      :precision precise :depth 1)
    )
    -----
---*)
