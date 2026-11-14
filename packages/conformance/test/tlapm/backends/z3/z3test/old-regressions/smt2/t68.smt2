(*---
description: z3test's regression old-regressions/smt2/t68.smt2.
ref: old-regressions/smt2/t68.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Int)

(assert (>= x 0))
(assert (iff (and (>= x 1)
                  (iff false true))
             true))
(assert (= x 20))

(apply simplify)


(reset)

(set-option :produce-proofs true)

(declare-const x Int)

(assert (>= x 0))
(assert (iff (and (>= x 1)
                  (iff false true))
             true))
(assert (= x 20))

(apply simplify)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      false
      :precision precise :depth 1)
    )
    (goals
    (goal
      false
      :precision precise :depth 1)
    )
---*)
