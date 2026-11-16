(*---
description: z3test's regression regressions/smt2/testfoldl.smt2.
ref: regressions/smt2/testfoldl.smt2
features:
  - z3test
outcome: sat
---*)
(push)
(declare-fun f (Int Int) Int)
(declare-const il (Seq Int))
(assert (= (seq.foldl f 0 il) 5))
(check-sat)
(pop)

(push)
(declare-const il (Seq Int))
(declare-const F (Array Bool Int Bool))
(assert (= (seq.foldl F true il) true))
(assert (> (seq.len il) 0))
(assert (not (= F ((as const (Array Bool Int Bool)) true))))
(check-sat)
(pop)


(push)
(declare-fun f (Int Int Int) Int)
(declare-const il (Seq Int))
(assert (= (seq.foldli f 0 0 il) 5))
(check-sat)
(pop)

(push)
(declare-const il (Seq Int))
(declare-const F (Array Int Bool Int Bool))
(assert (= (seq.foldli F 5 true il) true))
(assert (> (seq.len il) 0))
(assert (not (= F ((as const (Array Int Bool Int Bool)) true))))
(check-sat)
(pop)

(push)
(declare-const f (Array Int Int Int))
(declare-const g (Array Int Bool Int Bool))
(declare-const il_1 (Seq Int))
(declare-const il_2 (Seq Int))
(declare-const i Int)
(simplify (seq.foldl f 2 (seq.++ il_1 il_2)))
(simplify (seq.foldl f 3 (seq.unit i)))
(simplify (seq.foldli g 2 false (seq.++ il_1 il_2)))
(simplify (seq.foldli g 3 true (seq.unit i)))
(simplify (seq.foldl f 2 (as seq.empty (Seq Int))))
(simplify (seq.foldli g 2 true (as seq.empty (Seq Int))))
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    sat
    sat
    (seq.fold_left f (seq.fold_left f 2 il_1) il_2)
    (select f 3 i)
    (seq.fold_lefti g (+ 2 (seq.len il_1)) (seq.fold_lefti g 2 false il_1) il_2)
    (select g 3 true i)
    2
    true
---*)
