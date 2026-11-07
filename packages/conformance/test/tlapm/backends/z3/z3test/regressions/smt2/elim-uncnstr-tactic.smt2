(*---
description: z3test's regression regressions/smt2/elim-uncnstr-tactic.smt2.
ref: regressions/smt2/elim-uncnstr-tactic.smt2
features:
  - z3test
outcome: any
---*)
; Copyright (c) 2018 Microsoft Corporation
; unit tests for elim-uncnstr tactic

(set-option :model_validate true)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvadd x y) (bvadd y z z)))
(assert (= z #x3))
(assert (= y #x5))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)


(assert (forall ((b (_ BitVec 8))) (exists ((a (_ BitVec 8))) (= a b))))
(apply elim-uncnstr)
(apply (then elim-uncnstr simplify))
(reset)

(assert (exists ((b (_ BitVec 8))) (forall ((a (_ BitVec 8))) (= a b))))
(apply elim-uncnstr)
(apply (then elim-uncnstr simplify))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvmul x y) (bvmul y z z)))
(assert (= z #x3))
(assert (= y #x5))
(apply elim-uncnstr)
; TBD produces incorrect model converte: (check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvxor x y) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(assert (= (bvshl x y) #x42))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(get-model)
(reset)

(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(assert (= (bvshl x y) #x42))
(assert (not (= x #x42)))
(apply elim-uncnstr)
(reset)

(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(assert (= (bvashr x y) #x42))
(apply elim-uncnstr)
(reset)

(declare-const x (_ BitVec 8))
(assert (forall ((y (_ BitVec 8))) (= (bvashr x y) #x42)))
(apply elim-uncnstr)
(reset)

(assert (forall ((x (_ BitVec 8)) (y (_ BitVec 8))) (= (bvashr x y) #x42)))
(apply elim-uncnstr)
(reset)

(assert (forall ((x (_ BitVec 8)) (y (_ BitVec 8))) (exists ((z (_ BitVec 8))) (= (bvashr x y) z))))
(apply elim-uncnstr)
(reset)

(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(assert (= (bvnot x) (bvneg y)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(get-model)
(reset)

(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(assert (= (bvand x y) #x33))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(get-model)
(reset)

(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(assert (= (bvor x y) #x33))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(get-model)
(reset)

(declare-const x (_ BitVec 8))
(assert (= (bvand x #x03) #x33))
(apply elim-uncnstr)
(reset)

(declare-const x (_ BitVec 8))
(assert (= (bvand x #xff) #x33))
(apply elim-uncnstr)
(reset)

(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))
(declare-const z (_ BitVec 8))
(assert (= (bvmul x y z) #x42))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(get-model)
(reset)

(assert (forall ((x (_ BitVec 8)) (y (_ BitVec 8))) (= (bvsdiv x y) #x42)))
(apply elim-uncnstr)
(reset)

(declare-const x Real)
(declare-const y Real)
(declare-const z Real)
(assert (= y 3))
(assert (= z 5))
(assert (= (* x y) (* y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x Real)
(declare-const y Real)
(declare-const z Real)
(assert (= (/ y x) (* y z z)))
(assert (= y 3))
(assert (= z 5))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(exit)

(declare-const x Int)
(declare-const y Int)
(declare-const z Int)
(assert (= (* x y) (* y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x Int)
(declare-const y Int)
(declare-const z Int)
(assert (= y 3))
(assert (= z 5))
(assert (= (+ x y) (* y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x Int)
(declare-const y Int)
(declare-const z Int)
(assert (= y 3))
(assert (= z 5))
(assert (= (div x y) (* y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x Int)
(declare-const y Int)
(declare-const z Int)
(assert (= y 3))
(assert (= z 5))
(assert (= (div y x) (* y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)



(declare-const x Real)
(declare-const y Real)
(declare-const z Real)
(assert (= (+ x y) (* y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x Real)
(declare-const y Real)
(declare-const z Real)
(assert (= (/ x y) (* y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)



(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvsub x y) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvsub y x) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)


(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvudiv x y) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvudiv y x) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvsdiv x y) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvsdiv y x) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvsrem x y) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvsrem y x) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)


(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvurem x y) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(declare-const x (_ BitVec 4))
(declare-const y (_ BitVec 4))
(declare-const z (_ BitVec 4))
(assert (= (bvurem y x) (bvmul y z z)))
(apply elim-uncnstr)
(check-sat-using (then elim-uncnstr smt))
(reset)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      k!1
      k!2
      k!3
      :precision precise :depth 1)
    )
    sat
    (goals
    (goal
      (forall ((b (_ BitVec 8))) (exists ((a (_ BitVec 8))) (= a b)))
      :precision precise :depth 0)
    )
    (goals
    (goal
      :precision precise :depth 1)
    )
    (goals
    (goal
      (exists ((b (_ BitVec 8))) (forall ((a (_ BitVec 8))) (= a b)))
      :precision precise :depth 0)
    )
    (goals
    (goal
      (exists ((b (_ BitVec 8))) (forall ((a (_ BitVec 8))) (= a b)))
      :precision precise :depth 1)
    )
    (goals
    (goal
      (= (bvmul x y) (bvmul y z z))
      (= z #x3)
      (= y #x5)
      :precision precise :depth 1)
    )
    (goals
    (goal
      (= (bvxor x y) (bvmul y z z))
      :precision precise :depth 1)
    )
    sat
    (goals
    (goal
      (= (bvshl x y) #x42)
      :precision precise :depth 1)
    )
    sat
    (
      (define-fun x () (_ BitVec 8)
        #x42)
      (define-fun y () (_ BitVec 8)
        #x00)
    )
    (goals
    (goal
      (= (bvshl x y) #x42)
      (not (= x #x42))
      :precision precise :depth 1)
    )
    (goals
    (goal
      (= (bvashr x y) #x42)
      :precision precise :depth 1)
    )
    (goals
    (goal
      (forall ((y (_ BitVec 8))) (= (bvashr x y) #x42))
      :precision precise :depth 1)
    )
    (goals
    (goal
      (forall ((x (_ BitVec 8)) (y (_ BitVec 8))) (= (bvashr x y) #x42))
      :precision precise :depth 0)
    )
    (goals
    (goal
      (forall ((x (_ BitVec 8)) (y (_ BitVec 8)))
        (exists ((z (_ BitVec 8))) (= (bvashr x y) z)))
      :precision precise :depth 0)
    )
    (goals
    (goal
      k!1
      :precision precise :depth 1)
    )
    sat
    (
      (define-fun x () (_ BitVec 8)
        #xff)
      (define-fun y () (_ BitVec 8)
        #x00)
    )
    (goals
    (goal
      (= (bvand x y) #x33)
      :precision precise :depth 1)
    )
    sat
    (
      (define-fun x () (_ BitVec 8)
        #x33)
      (define-fun y () (_ BitVec 8)
        #x33)
    )
    (goals
    (goal
      k!1
      :precision precise :depth 1)
    )
    sat
    (
      (define-fun x () (_ BitVec 8)
        #x33)
      (define-fun y () (_ BitVec 8)
        #x00)
    )
    (goals
    (goal
      (= (bvand x #x03) #x33)
      :precision precise :depth 1)
    )
    (goals
    (goal
      (= (bvand x #xff) #x33)
      :precision precise :depth 1)
    )
    (goals
    (goal
      k!1
      :precision precise :depth 1)
    )
    sat
    (
      (define-fun x () (_ BitVec 8)
        #x42)
      (define-fun z () (_ BitVec 8)
        #x01)
      (define-fun y () (_ BitVec 8)
        #x01)
    )
    (goals
    (goal
      (forall ((x (_ BitVec 8)) (y (_ BitVec 8))) (= (bvsdiv x y) #x42))
      :precision precise :depth 0)
    )
    (goals
    (goal
      (= y (to_real 3))
      (= z (to_real 5))
      (= (* x y) (* y z z))
      :precision precise :depth 1)
    )
    sat
    (goals
    (goal
      (= (/ y x) (* y z z))
      (= y (to_real 3))
      (= z (to_real 5))
      :precision precise :depth 1)
    )
    sat
---*)
