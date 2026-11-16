(*---
description: z3test's regression regressions/smt2/z3.2.smt2.
ref: regressions/smt2/z3.2.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(declare-const a Int)
(declare-fun f (Int Bool) Int)
(assert (> a 10))
(assert (< (f a true) 100))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
