(*---
description: z3test's regression old-regressions/smt2/nlbool.smt2.
ref: old-regressions/smt2/nlbool.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const b1 Bool)
(declare-const b2 Bool)
(declare-const b3 Bool)

(assert (or b1 b2 b3))

(check-sat-using nlsat)
(eval (or b1 b2 b3))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    true
---*)
