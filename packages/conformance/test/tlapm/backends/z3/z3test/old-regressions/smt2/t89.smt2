(*---
description: z3test's regression old-regressions/smt2/t89.smt2.
ref: old-regressions/smt2/t89.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :produce-models true)
(declare-const x Int)
(declare-const y Int)
(declare-const z Int)

(assert (>= y 0))
(assert (>= z 0))
(assert (>= x 0))
(assert (= (+ y x (* 2 z)) 20))
(apply elim-uncnstr :print-model-converter true)
(reset)
(echo "-----")

(set-option :produce-models true)
(declare-const x Real)
(declare-const y Real)
(declare-const z Real)

(assert (>= y 0.0))
(assert (>= z 0.0))
(assert (>= x 0.0))
(assert (= (+ y x (* 2.0 z)) 20.0))
(apply elim-uncnstr :print-model-converter true)
(reset)
(echo "-----")

(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(declare-fun f ((_ BitVec 16)) Int)
(declare-fun g ((_ BitVec 16)) Real)
(declare-const x1 Int)
(declare-const x2 Int)
(declare-const y1 Real)
(declare-const y2 Real)
(declare-const a1 (_ BitVec 8))
(declare-const a2 (_ BitVec 8))
(declare-fun h ((_ BitVec 8)) Int)

(set-option :produce-models true)
(assert (= (h (bvmul #x03 a1)) 0))
(assert (bvsle a1 #x05))
(assert (= (* x1 x2) 20))
(assert (= x1 20))
(assert (= (* 10.0 y1) (g #x0001)))
(assert (>= y1 3.0))
(assert (= (f (concat x y z)) 0))
(assert (= (concat x y z) (concat y x z)))
(apply (and-then simplify elim-uncnstr) :print-model-converter true)
(reset)
(echo "-----")

(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-fun p ((_ BitVec 5)) Bool)
(assert (p ((_ extract 6 2) x)))
(assert (bvsle x #x05))
(apply elim-uncnstr :print-model-converter true)
(reset)
(echo "-----")

(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-fun p ((_ BitVec 5)) Bool)
(assert (p ((_ extract 4 0) x)))
(assert (bvsle x #x05))
(apply elim-uncnstr :print-model-converter true)
(reset)
(echo "-----")


(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-fun p ((_ BitVec 5)) Bool)
(assert (p ((_ extract 7 3) x)))
(assert (bvsle x #x05))
(apply elim-uncnstr :print-model-converter true)
(reset)
(echo "-----")

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (>= y 0)
      (>= z 0)
      (>= x 0)
      (= (+ y x (* 2 z)) 20)
      :precision precise :depth 0)
    )
    -----
    (goals
    (goal
      (>= y 0.0)
      (>= z 0.0)
      (>= x 0.0)
      (= (+ y x (* 2.0 z)) 20.0)
      :precision precise :depth 0)
    )
    -----
    (goals
    (goal
      (= (h (bvmul #x03 a1)) 0)
      (bvsle a1 #x05)
      (= (* x1 x2) 20)
      (= x1 20)
      (= (* 10.0 y1) (g #x0001))
      (>= y1 3.0)
      (= (f (concat x y z)) 0)
      (= y ((_ extract 3 0) x))
      (= ((_ extract 3 0) x) ((_ extract 7 4) x))
      (= ((_ extract 7 4) x) y)
      :precision precise :depth 2)
    )
    -----
    (goals
    (goal
      (p ((_ extract 6 2) x))
      (bvsle x #x05)
      :precision precise :depth 0)
    )
    -----
    (goals
    (goal
      (p ((_ extract 4 0) x))
      (bvsle x #x05)
      :precision precise :depth 0)
    )
    -----
    (goals
    (goal
      (p ((_ extract 7 3) x))
      (bvsle x #x05)
      :precision precise :depth 0)
    )
    -----
---*)
