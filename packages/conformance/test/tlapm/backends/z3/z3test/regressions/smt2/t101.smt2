(*---
description: z3test's regression regressions/smt2/t101.smt2.
ref: regressions/smt2/t101.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :pp.flat-assoc false)

(declare-const p1 Bool)
(declare-const p2 Bool)
(declare-const p3 Bool)

(simplify (xor p1 p2 p3))

(*--- recorded
all:
  exit: 0
  transcript: (= p1 (= p2 p3))
---*)
