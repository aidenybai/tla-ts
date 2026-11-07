(*---
description: z3test's regression regressions/smt2/t145.smt2.
ref: regressions/smt2/t145.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const v0 (_ BitVec 8))
(simplify (bvashr (bvashr v0 #x01) v0))
(declare-const v1 (_ BitVec 8))
(simplify (bvashr (bvashr v0 v1) #x01))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (bvashr (bvashr v0 #x01) v0)
    (bvashr (bvashr v0 v1) #x01)
---*)
