(*---
description: z3test's regression regressions/smt2/bv0.smt2.
ref: regressions/smt2/bv0.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a (_ BitVec 0))

(*--- recorded
all:
  exit: 0
  transcript: '(error "line 5 column 28: bit-vector size must be greater than zero")'
---*)
