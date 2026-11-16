(*---
description: z3test's regression regressions/smt2/testmap.smt2.
ref: regressions/smt2/testmap.smt2
features:
  - z3test
outcome: sat
---*)
(push)
(declare-fun f (Int) Bool)
(declare-const il (Seq Int))
(assert (= (seq.map f il) (seq.++ (seq.unit false) (seq.unit true) (seq.unit false))))
(check-sat)
(pop)

(push)
(declare-const il (Seq Int))
(declare-const F (Array Int Bool))
(assert (= (seq.map F il) (seq.++ (seq.unit false) (seq.unit true) (seq.unit false))))
(check-sat)
(pop)

(push)
(declare-const f (Array Int Bool))
(declare-const il_1 (Seq Int))
(declare-const il_2 (Seq Int))
(simplify (seq.map f (as seq.empty (Seq Int))))
(simplify (seq.map f (seq.++ il_1 il_2)))
(simplify (seq.map f (seq.unit 4)))
(pop)

(push)
(declare-fun f (Int) Bool)
(declare-const il (Seq Int))
(declare-const bl (Seq Bool))
(assert (= (seq.map f il) bl))
(assert (> (seq.len il) 1))
(check-sat)
(pop)


(push)
(declare-fun f (Int) Bool)
(declare-fun p ((Seq Bool)) Bool)
(declare-const il (Seq Int))
(assert (p (seq.map f il)))
(assert (not (p (seq.unit false))))
(assert (not (p (seq.unit true))))
(assert (not (= il (as seq.empty (Seq Int)))))
(check-sat)
(eval (>= (seq.len il) 2))
;(get-model)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    (as seq.empty (Seq Bool))
    (seq.++ (seq.map f il_1) (seq.map f il_2))
    (seq.unit (select f 4))
    sat
    sat
    true
---*)
