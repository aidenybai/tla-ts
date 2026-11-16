(*---
description: z3test's regression regressions/smt2/t209.smt2.
ref: regressions/smt2/t209.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.decimal true)

(simplify (^ 2.0 (- (/ 1.0 2.0))))

(*--- recorded
all:
  exit: 0
  transcript: 0.7071067811?
---*)
