(*---
description: z3test's regression regressions/smt2/t173.smt2.
ref: regressions/smt2/t173.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic ABV)
(declare-fun x () (_ BitVec 16))
(declare-const t (Array (_ BitVec 16) (_ BitVec 16)))
(assert (= (select t #x0000) #x0000))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
