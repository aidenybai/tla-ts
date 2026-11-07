(*---
description: z3test's regression regressions/smt2/t111.smt2.
ref: regressions/smt2/t111.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x1 Int)
(declare-const x2 Int)
(declare-const x3 Int)
(declare-const x4 Int)

(simplify (distinct x1 x2 x3 x4)
          :blast-distinct true)
(simplify (distinct x1 x2 x3 x4)
          :blast-distinct true
          :elim-and true)
(simplify (distinct x1 (+ x1 1) x3 x4)
          :blast-distinct true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (and (not (= x1 x2))
         (not (= x1 x3))
         (not (= x1 x4))
         (not (= x2 x3))
         (not (= x2 x4))
         (not (= x3 x4)))
    (not (or (= x1 x2) (= x1 x3) (= x1 x4) (= x2 x3) (= x2 x4) (= x3 x4)))
    (and (not (= x1 x3))
         (not (= x1 x4))
         (not (= x1 (+ (- 1) x3)))
         (not (= x1 (+ (- 1) x4)))
         (not (= x3 x4)))
---*)
