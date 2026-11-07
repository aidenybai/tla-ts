(*---
description: z3test's regression regressions/smt2/t122.smt2.
ref: regressions/smt2/t122.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(simplify (= (bvsmod #b0000 #b1010) #b1010))

(*--- recorded
all:
  exit: 0
  transcript: 'false'
---*)
