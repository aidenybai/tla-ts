(*---
description: z3test's regression regressions/smt2/attr_bug.smt2.
ref: regressions/smt2/attr_bug.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-fun f (Int) Bool)

(display (forall ((x Int)) (! (f x) :skolemid |foo:10|)))

(*--- recorded
all:
  exit: 0
  transcript: (forall ((x Int)) (! (f x) :skolemid |foo:10|))
---*)
