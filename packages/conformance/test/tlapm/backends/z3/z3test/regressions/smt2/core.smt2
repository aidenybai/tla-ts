(*---
description: z3test's regression regressions/smt2/core.smt2.
ref: regressions/smt2/core.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-logic QF_LRA)
(set-option :auto-config true)
(set-option :produce-unsat-cores true)

(assert (! (= 1 0) :named a))

(check-sat)
(get-unsat-core)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    (a)
---*)
