(*---
description: z3test's regression regressions/smt2/issue-1699.smt2.
ref: regressions/smt2/issue-1699.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2018 Levent Erkok, Microsoft Corporation
; GitHub issue

(set-option :produce-models true)
(declare-fun x () Int)
(assert (>= 1 x))
(assert (<= 0 x))
(minimize x)
(maximize (+ x x))
(set-option :opt.priority pareto)
(check-sat)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (
      (define-fun x () Int
        0)
    )
---*)
