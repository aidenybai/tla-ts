(*---
description: z3test's regression regressions/smt2/z3name_bug.smt2.
ref: regressions/smt2/z3name_bug.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :model.compact true)
(declare-fun p (Int) Bool)
;(declare-fun f (Int Real) Bool)

(assert (p (ite (p 1) 10 20)))
(assert (p 1))
(check-sat-using (then nnf smt))
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
