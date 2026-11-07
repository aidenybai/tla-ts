(*---
description: z3test's regression old-regressions/smt2/t52.smt2.
ref: old-regressions/smt2/t52.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(define-sort W () (_ BitVec 8))

(declare-const c1 W)
(declare-const c2 W)
(declare-const c3 W)

(simplify (bvslt c1 c2))
(simplify (bvsle c1 c2))
(simplify (bvsge c1 c2))
(simplify (bvsgt c1 c2))

(simplify (bvult c1 c2))
(simplify (bvule c1 c2))
(simplify (bvuge c1 c2))
(simplify (bvugt c1 c2))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (not (bvsle c2 c1))
    (bvsle c1 c2)
    (bvsle c2 c1)
    (not (bvsle c1 c2))
    (not (bvule c2 c1))
    (bvule c1 c2)
    (bvule c2 c1)
    (not (bvule c1 c2))
---*)
