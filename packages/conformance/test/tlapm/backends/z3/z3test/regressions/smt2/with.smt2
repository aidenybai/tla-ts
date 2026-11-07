(*---
description: z3test's regression regressions/smt2/with.smt2.
ref: regressions/smt2/with.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-logic QF_BV)
(declare-fun a () Bool)
(declare-fun a () Bool)

(*--- recorded
all:
  exit: 0
  transcript: '(error "line 6 column 22: invalid declaration, constant ''a'' (with the given signature) already declared")'
---*)
