(*---
description: z3test's regression regressions/smt2/t119.smt2.
ref: regressions/smt2/t119.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



(declare-const a Real)
(declare-const b Real)
(declare-const c Real)

(set-option :produce-models true)

(assert (= (+ (* 2.0 a) (* 3.0 b) (* 2.0 c)) 10.0))
(assert (>= c a))
(assert (>= c b))

(apply (and-then simplify solve-eqs) :print-model-converter false)

(assert (= (+ c b) 0.0))

(apply (and-then simplify solve-eqs) :print-model-converter false)

(apply (and-then simplify (! solve-eqs :theory-solver false)) :print-model-converter false)

(reset)

(declare-const a Int)
(declare-const b Int)
(declare-const c Int)

(set-option :produce-models true)

(assert (= (+ (* 2 a) (* 3 b) (* 2 c)) 10))
(assert (>= c a))
(assert (>= c b))

(apply (and-then simplify solve-eqs) :print-model-converter false)

(assert (= (+ c b a) 1))

(apply (and-then simplify solve-eqs) :print-model-converter false)

(reset)

(declare-const a Int)
(declare-const b Int)
(declare-fun f (Int) Int)

(set-option :produce-models true)

(assert (= (+ a (f a)) 20))

(apply (and-then simplify solve-eqs) :print-model-converter false)

(assert (= (+ a (f a) b) 20))
(assert (>= b 10))
(apply (and-then simplify solve-eqs) :print-model-converter false)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (>= (* 2.0 c) (+ 5.0 (* (- (/ 3.0 2.0)) b)))
      (>= c b)
      :precision precise :depth 2)
    )
    (goals
    (goal
      (>= c 10.0)
      (>= c 0.0)
      :precision precise :depth 2)
    )
    (goals
    (goal
      (= (+ (* 2.0 a) (* 3.0 b) (* 2.0 c)) 10.0)
      (>= c a)
      (>= c b)
      (= (+ c b) 0.0)
      :precision precise :depth 2)
    )
    (goals
    (goal
      (= (+ (* 2 a) (* 3 b) (* 2 c)) 10)
      (>= c a)
      (>= c b)
      :precision precise :depth 2)
    )
    (goals
    (goal
      (<= a (- 4))
      (<= a (- 15))
      :precision precise :depth 2)
    )
    (goals
    (goal
      (= (+ a (f a)) 20)
      :precision precise :depth 2)
    )
    (goals
    (goal
      (= (+ a (f a)) 20)
      (>= (+ (* (- 1) a) (* (- 1) (f a))) (- 10))
      :precision precise :depth 2)
    )
---*)
