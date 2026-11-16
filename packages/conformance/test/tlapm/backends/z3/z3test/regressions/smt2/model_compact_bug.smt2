(*---
description: z3test's regression regressions/smt2/model_compact_bug.smt2.
ref: regressions/smt2/model_compact_bug.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :model.compact true)
(declare-fun p (Int) Bool)
(assert (p 1))
(assert (p 2))
(assert (p 3))
(check-sat-using smt)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (
      (define-fun p ((x!0 Int)) Bool
        true)
    )
---*)
