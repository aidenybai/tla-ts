(*---
description: z3test's regression old-regressions/smt2/t51.smt2.
ref: old-regressions/smt2/t51.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(define-sort W () (_ BitVec 8))

(declare-const c1 W)
(declare-const c2 W)
(declare-const c3 W)

(simplify (bvsle #x0a #x0a))
(simplify (bvsle #x0a #x0f))
(simplify (bvsle #xfa #x0f))
(simplify (bvule #xfa #x0f))
(echo "----")
(simplify (bvsge #x0a #x0a))
(simplify (bvsge #x0a #x0f))
(simplify (bvsge #xfa #x0f))
(simplify (bvuge #xfa #x0f))
(echo "----")
(simplify (bvsgt #x0a #x0a))
(simplify (bvsgt #x0a #x0f))
(simplify (bvsgt #xfa #x0f))
(simplify (bvugt #xfa #x0f))
(echo "----")
(simplify (bvslt #x0a #x0a))
(simplify (bvslt #x0a #x0f))
(simplify (bvslt #xfa #x0f))
(simplify (bvult #xfa #x0f))
(echo "----")
(simplify (bvslt c1 c1))
(simplify (bvsle c1 c1))
(simplify (bvsge c1 c1))
(simplify (bvsgt c1 c1))

(simplify (bvult c1 c1))
(simplify (bvule c1 c1))
(simplify (bvuge c1 c1))
(simplify (bvugt c1 c1))
(echo "----")
(simplify (bvule (concat c1 c2) (concat #x00 c3)))
(simplify (bvuge (concat #x00 c2) (concat c1 c3)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    true
    true
    false
    ----
    true
    false
    false
    true
    ----
    false
    false
    false
    true
    ----
    false
    true
    true
    false
    ----
    false
    true
    true
    false
    false
    true
    true
    false
    ----
    (and (= c1 #x00) (bvule c2 c3))
    (and (= c1 #x00) (bvule c3 c2))
---*)
