(*---
description: z3test's regression old-regressions/smt2/t287.smt2.
ref: old-regressions/smt2/t287.smt2
features:
  - z3test
outcome: unknown
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Int)

(assert (> x 0))

(check-sat-using (and-then (or-else fail fail) simplify))

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
