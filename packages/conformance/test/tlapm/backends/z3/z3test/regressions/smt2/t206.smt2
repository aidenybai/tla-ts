(*---
description: z3test's regression regressions/smt2/t206.smt2.
ref: regressions/smt2/t206.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(simplify (^ 3.0 (- 2.0)))

(*--- recorded
all:
  exit: 0
  transcript: (/ 1.0 9.0)
---*)
