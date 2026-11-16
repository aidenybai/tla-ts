(*---
description: z3test's regression old-regressions/smt2/t61.smt2.
ref: old-regressions/smt2/t61.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(define-sort B () (_ BitVec 1))
(define-sort W () (_ BitVec 16))
(declare-const a1 B)
(declare-const a2 B)
(declare-const c1 W)

(simplify (iff (= a1 #b1) (bvsle c1 #x0000)))
(simplify (= (= a1 #b1) (bvsle c1 #x0000)))
(simplify (iff (= a1 #b0) (bvsle c1 #x0000)))
(simplify (= (= a1 #b0) (bvsle c1 #x0000)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (= a1 (ite (bvsle c1 #x0000) #b1 #b0))
    (= a1 (ite (bvsle c1 #x0000) #b1 #b0))
    (= a1 (ite (bvsle c1 #x0000) #b0 #b1))
    (= a1 (ite (bvsle c1 #x0000) #b0 #b1))
---*)
