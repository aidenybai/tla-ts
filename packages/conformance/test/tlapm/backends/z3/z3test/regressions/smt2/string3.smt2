(*---
description: z3test's regression regressions/smt2/string3.smt2.
ref: regressions/smt2/string3.smt2
features:
  - z3test
outcome: unsat
---*)
; Copyright (c) 2017 Microsoft Corporation
; Issuue 949

(declare-const x String)

(assert (not (str.prefixof "prefix:" x)))

(assert (or
         (str.prefixof "prefix:a" x)
         (str.prefixof "prefix:b" x)
         (str.prefixof "prefix:c" x)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
