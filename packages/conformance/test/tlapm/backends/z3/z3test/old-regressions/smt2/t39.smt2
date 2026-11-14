(*---
description: z3test's regression old-regressions/smt2/t39.smt2.
ref: old-regressions/smt2/t39.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Int)

(simplify (< 1 2))
(simplify (< 3 2))
(simplify (< 2 2))
(simplify (<= 1 2))
(simplify (<= 2 2))
(simplify (<= 3 2))
(simplify (> 1 2))
(simplify (> 2 2))
(simplify (> 3 2))
(simplify (>= 1 2))
(simplify (>= 2 2))
(simplify (>= 3 2))
(simplify (< a (+ b 1)))
(simplify (< a (+ b 1))
                 :arith-lhs true)
(simplify (< a (+ b a 1))
                 :arith-lhs true)
(simplify (< a (+ b a a 1))
                 :arith-lhs true)
(simplify (< a (+ b a a 1)))
(simplify (> a (+ b 1))
                 :arith-lhs true)
(simplify (> (* 3 a) (+ b a 1))
                 :arith-lhs true)
(simplify (>= (* 3 a) (+ b a 1))
                 :arith-lhs true)
(simplify (>= (* 3 a) (+ b a 1)))

(simplify (>= (+ (* 3 a) (* 2 b) 4) (+ (* 4 b) a 1 c d)))
(simplify (>= (+ (* 3 a) (* 2 b) 4) (+ (* 4 b) a 1 c d))
                 :arith-lhs true)
(simplify (<= (+ (* 3 a) (* 2 b) 4) (+ (* 4 b) a 1 c d)))
(simplify (<= (+ (* 3 a) (* 2 b) 4) (+ (* 4 b) a 1 c d))
                 :arith-lhs true)
(simplify (<= (+ (* 3 a) (* 2 b) 4) (+ (* 4 b) a 10 c d)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    false
    false
    true
    true
    false
    false
    false
    true
    false
    true
    true
    (not (<= b (+ (- 1) a)))
    (not (<= (+ b (* (- 1) a)) (- 1)))
    (not (<= b (- 1)))
    (not (<= (+ b a) (- 1)))
    (not (<= (+ b a) (- 1)))
    (not (<= (+ a (* (- 1) b)) 1))
    (not (<= (+ (* 2 a) (* (- 1) b)) 1))
    (>= (+ (* 2 a) (* (- 1) b)) 1)
    (>= (* 2 a) (+ 1 b))
    (>= (+ (* 2 a) (* (- 2) b)) (+ (- 3) c d))
    (>= (+ (* 2 a) (* (- 2) b) (* (- 1) c) (* (- 1) d)) (- 3))
    (<= (+ (* 2 a) (* (- 2) b)) (+ (- 3) c d))
    (<= (+ (* 2 a) (* (- 2) b) (* (- 1) c) (* (- 1) d)) (- 3))
    (<= (+ (* 2 a) (* (- 2) b)) (+ 6 c d))
---*)
