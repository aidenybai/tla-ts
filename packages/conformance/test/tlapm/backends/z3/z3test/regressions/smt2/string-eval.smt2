(*---
description: z3test's regression regressions/smt2/string-eval.smt2.
ref: regressions/smt2/string-eval.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2016 Microsoft Corporation
(declare-const s String)
(check-sat)
(get-value (s))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    ((s ""))
---*)
