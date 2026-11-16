(*---
description: z3test's regression regressions/smt2/core2.smt2.
ref: regressions/smt2/core2.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :produce-unsat-cores true)

(declare-const a Bool)
(assert (or (not a) (= 1 0)))
(check-sat a)
(get-unsat-core)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    (a)
---*)
