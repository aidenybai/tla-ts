(*---
description: z3test's regression regressions/smt2/div.smt2.
ref: regressions/smt2/div.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Real)
(declare-const b Real)

(display (/ a b 10.0))
(display (div 10 3 2))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (/ (/ a b) 10.0)
    (div (div 10 3) 2)
---*)
