(*---
description: z3test's regression regressions/smt2/issue-1655.smt2.
ref: regressions/smt2/issue-1655.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2018 Microsoft Corporation
; GitHub issue

(set-logic QF_BV)
(set-option :produce-models true)
(declare-fun x () (_ BitVec 8))
(declare-fun m () (_ BitVec 8))
(assert (= m x))
(maximize x)
(check-sat)
(get-objectives)
(get-value (m))
(get-value (x))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x 255)
    )
    ((m #xff))
    ((x #xff))
---*)
