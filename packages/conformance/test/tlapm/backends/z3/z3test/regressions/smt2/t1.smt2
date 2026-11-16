(*---
description: z3test's regression regressions/smt2/t1.smt2.
ref: regressions/smt2/t1.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


{

(display 10)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 5 column 0: unexpected character")
    10
---*)
