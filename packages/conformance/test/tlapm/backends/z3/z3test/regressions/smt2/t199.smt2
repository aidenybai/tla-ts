(*---
description: z3test's regression regressions/smt2/t199.smt2.
ref: regressions/smt2/t199.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-datatypes () ((T A B)))
(assert ((_ is A) A))
(assert ((_ is B) B))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
