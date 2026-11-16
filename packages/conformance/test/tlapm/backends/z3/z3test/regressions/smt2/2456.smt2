(*---
description: z3test's regression regressions/smt2/2456.smt2.
ref: regressions/smt2/2456.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :smt.mbqi true)

(declare-sort A)
(declare-sort B)
(declare-fun f (A) B)

(assert
 (forall ((b B) (x A) (y A))
         (or (= x y)
             (not (= (f x) b)))))
(declare-fun a1 () A)
(declare-fun a2 () A)
(declare-fun x () B)
(assert (not (= a1 a2)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
