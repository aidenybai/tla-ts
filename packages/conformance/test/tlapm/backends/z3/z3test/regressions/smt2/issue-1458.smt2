(*---
description: z3test's regression regressions/smt2/issue-1458.smt2.
ref: regressions/smt2/issue-1458.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2018 Microsoft Corporation
; GitHub issue

(set-logic UFBV)
            (declare-fun n ((_ BitVec 1)) (_ BitVec 1))
            (assert (forall ((i (_ BitVec 1))) (= (n i) (ite (= i #b1) #b0 (n #b1)))))
            (assert (= (n #b0) #b0))
            (check-sat)

(reset)

(set-logic ALL)

(declare-fun n1 ((_ BitVec 1)) (_ BitVec 1))
(declare-fun n2 ((_ BitVec 1)) (_ BitVec 1))
(assert (forall ((i1 (_ BitVec 1))) (= (n2 i1) (n1 i1))))
(assert (forall ((i1 (_ BitVec 1))) (= (n1 i1) (bvadd #b1 (n2 i1)))))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    unsat
---*)
