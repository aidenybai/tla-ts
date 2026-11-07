(*---
description: z3test's regression regressions/smt2/z3.1.smt2.
ref: regressions/smt2/z3.1.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(echo "starting Z3...")
(declare-const a Int)
(declare-fun f (Int Bool) Int)

(*--- recorded
all:
  exit: 0
  transcript: starting Z3...
---*)
