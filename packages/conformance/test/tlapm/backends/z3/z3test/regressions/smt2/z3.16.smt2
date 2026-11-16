(*---
description: z3test's regression regressions/smt2/z3.16.smt2.
ref: regressions/smt2/z3.16.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(declare-const l1 (List Int))
(declare-const l2 (List Int))
(declare-const l3 (List Int))
(declare-const x Int)
(assert (not (= l1 nil)))
(assert (not (= l2 nil)))
(assert (= (head l1) (head l2)))
(assert (not (= l1 l2)))
(assert (= l3 (insert x l2)))
(assert (> x 100))
(check-sat)
;(get-model)
(assert (= (tail l1) (tail l2)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    unsat
---*)
