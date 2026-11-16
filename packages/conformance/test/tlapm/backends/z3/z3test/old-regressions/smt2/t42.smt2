(*---
description: z3test's regression old-regressions/smt2/t42.smt2.
ref: old-regressions/smt2/t42.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const a Int)
(declare-const b Int)
(declare-const r Real)
(declare-const s Real)

(simplify (<= (- a) 3))

(simplify (<= (* 2.0 r) 3.0))
(simplify (>= (* 2.0 r) 3.0))
(simplify (>= (- (* 2.0 r)) 3.0))
(simplify (<= (- (* 2.0 r)) 3.0))
(simplify (= (- (* 2.0 r)) 3.0))

(simplify (<= (* 2 (- a)) 3))
(simplify (<= (* 2 (- a)) 4))
(simplify (<= (* 4 (- a)) 4))
(simplify (<= (* 4 (- a)) (- 4)))

(simplify (<= (* 2 (- a)) 3))
(simplify (<= (* 2 (- a)) 4))
(simplify (<= (* 4 (- a)) 4))
(simplify (<= (* 4 (- a)) (- 4)))

(simplify (>= (* 2 (- a)) 3))
(simplify (>= (* 2 (- a)) 4))
(simplify (>= (* 4 (- a)) 4))
(simplify (>= (* 4 (- a)) (- 4)))


(simplify (<= (* 2 a) 3))
(simplify (<= (* 2 a) 4))
(simplify (<= (* 4 a) 4))
(simplify (<= (* 4 a) (- 4)))

(simplify (>= (* 2 a) 3))
(simplify (>= (* 2 a) 4))
(simplify (>= (* 4 a) 4))
(simplify (>= (* 4 a) (- 4)))

(simplify (>= (+ (* 2 (- a)) b) (+ 3 b)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (>= a (- 3))
    (<= r (/ 3.0 2.0))
    (>= r (/ 3.0 2.0))
    (<= r (- (/ 3.0 2.0)))
    (>= r (- (/ 3.0 2.0)))
    (= r (- (/ 3.0 2.0)))
    (>= a (- 1))
    (>= a (- 2))
    (>= a (- 1))
    (>= a 1)
    (>= a (- 1))
    (>= a (- 2))
    (>= a (- 1))
    (>= a 1)
    (<= a (- 2))
    (<= a (- 2))
    (<= a (- 1))
    (<= a 1)
    (<= a 1)
    (<= a 2)
    (<= a 1)
    (<= a (- 1))
    (>= a 2)
    (>= a 2)
    (>= a 1)
    (>= a (- 1))
    (<= a (- 2))
---*)
