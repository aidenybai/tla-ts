(*---
description: z3test's regression regressions/smt2/t16.smt2.
ref: regressions/smt2/t16.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :produce-models true)
(check-sat)
(eval (bv2int (bvadd #x0a #xf0)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    250
---*)
