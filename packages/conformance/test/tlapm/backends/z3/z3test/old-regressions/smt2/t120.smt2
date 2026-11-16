(*---
description: z3test's regression old-regressions/smt2/t120.smt2.
ref: old-regressions/smt2/t120.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a1 Int)
(declare-const a2 Int)
(declare-const a3 Int)
(declare-const p1 Bool)
(declare-const p2 Bool)

(assert (>= a1 0))
(assert (or p1 p2))
(assert (or p1 (>= a1 1)))
(assert (or p2 (>= a1 2) p1 (>= a1 3)))
(assert (or (>= a1 4) (>= a1 5) (>= a1 6)))
(assert (or (not p2) (>= a1 2) p1 (>= a1 3)))
(assert (or (not p2) (not (>= a1 2)) p1 (not (>= a1 3))))
(assert (or (not p2) (not (>= a1 2)) p1 (not (>= a1 3)) (>= a1 10)))
(assert (or (not p2) (>= a1 2) p1 (>= a1 3) (not (>= a1 10))))
(assert (or (not p2) (>= a1 2) p1 (>= a1 3) (>= a1 10)))

(apply occf)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (>= a1 0)
      (or p1 p2)
      (or p1 (>= a1 1))
      (or p2 p1 k!0 (>= a1 2))
      (or k!1 k!2 (>= a1 4))
      (or (not p2) p1 k!0 (>= a1 2))
      (or (not p2) p1 (not k!0) (not (>= a1 2)))
      (or (not p2) p1 (not k!0) k!3 (not (>= a1 2)))
      (or (not p2) p1 k!0 (not k!3) (>= a1 2))
      (or (not p2) p1 k!0 k!3 (>= a1 2))
      (or (not k!0) (>= a1 3))
      (or (not k!1) (>= a1 5))
      (or (not k!2) (>= a1 6))
      (or k!0 (not (>= a1 3)))
      (or (not k!3) (>= a1 10))
      (or k!3 (not (>= a1 10)))
      :precision precise :depth 1)
    )
---*)
