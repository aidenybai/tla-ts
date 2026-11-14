(*---
description: z3test's regression regressions/smt2/testmapi.smt2.
ref: regressions/smt2/testmapi.smt2
features:
  - z3test
outcome: sat
---*)
(push)
(declare-fun f (Int Int) Bool)
(declare-const il (Seq Int))
(assert (= (seq.mapi f 0 il) (seq.++ (seq.unit false) (seq.unit true) (seq.unit false))))
(check-sat)
(pop)

(push)
(declare-const il (Seq Int))
(declare-const F (Array Int Int Bool))
(assert (= (seq.mapi F 0 il) (seq.++ (seq.unit false) (seq.unit true) (seq.unit false))))
(check-sat)
(pop)

(push)
(declare-const f (Array Int Int Bool))
(declare-const il_1 (Seq Int))
(declare-const il_2 (Seq Int))
(simplify (seq.mapi f 1 (as seq.empty (Seq Int))))
(simplify (seq.mapi f 2 (seq.++ il_1 il_2)))
(simplify (seq.mapi f 3 (seq.unit 4)))
(pop)

(push)
(declare-fun f (Int Int) Bool)
(declare-const il (Seq Int))
(declare-const bl (Seq Bool))
(assert (= (seq.mapi f 1 il) bl))
(assert (> (seq.len il) 1))
(check-sat)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    (as seq.empty (Seq Bool))
    (seq.++ (seq.mapi f 2 il_1) (seq.mapi f (+ 2 (seq.len il_1)) il_2))
    (seq.unit (select f 3 4))
    sat
---*)
