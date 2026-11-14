(*---
description: z3test's regression regressions/smt2/z3.6.smt2.
ref: regressions/smt2/z3.6.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Real)
(declare-const e Real)

(*--- recorded
all:
  exit: 0
---*)
