(*---
description: z3test's regression old-regressions/smt2/t79.smt2.
ref: old-regressions/smt2/t79.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const a (_ BitVec 1))
(declare-const b (_ BitVec 1))

(simplify (= (bvor a b) #b0))

(*--- recorded
all:
  exit: 0
  transcript: '(not (or (= a #b1) (= b #b1)))'
---*)
