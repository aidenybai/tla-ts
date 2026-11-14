(*---
description: z3test's regression regressions/smt2/t158.smt2.
ref: regressions/smt2/t158.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config false) (set-option :smt.mbqi false) (declare-fun f (Int Int) Int)
(declare-fun a () Int)
(assert (forall ((x Int) (y Int)) (=> (and (= x (f y x))) (= y (f a (f y x)))) (= x y))))
(assert (forall ((x Int) (y Int)) (=> (and (= x (f y x)) (= y (f a (f y x)))) (= x y)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 5 column 86: invalid quantified expression, syntax error: (forall|exists ((<symbol> <sort>)*) <expr>) expected")
    (error "line 6 column 88: invalid command, '(' expected")
    unknown
---*)
