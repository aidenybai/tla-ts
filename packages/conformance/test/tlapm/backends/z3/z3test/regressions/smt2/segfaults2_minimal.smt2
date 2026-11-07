(*---
description: z3test's regression regressions/smt2/segfaults2_minimal.smt2.
ref: regressions/smt2/segfaults2_minimal.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config false)
(set-option :smt.mbqi false)

(declare-fun ff ((Array Int Int)) (Array Int Int))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern (= s (ff s)))))

(apply simplify)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (forall ((s (Array Int Int))) (! (= s (ff s)) :pattern ((= s (ff s)))))
      :precision precise :depth 1)
    )
---*)
