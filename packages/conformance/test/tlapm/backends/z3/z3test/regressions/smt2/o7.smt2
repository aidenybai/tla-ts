(*---
description: z3test's regression regressions/smt2/o7.smt2.
ref: regressions/smt2/o7.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2016 Microsoft Corporation
(declare-const i Int)
(declare-const j Int)

(assert-soft (> i j) :weight 1 )
(assert-soft (< i j) :weight 40.1 )
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     ( 1)
    )
---*)
