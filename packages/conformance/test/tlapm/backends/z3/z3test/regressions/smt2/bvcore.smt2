(*---
description: z3test's regression regressions/smt2/bvcore.smt2.
ref: regressions/smt2/bvcore.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-logic QF_BV)
(set-option :auto-config true)
(set-option :produce-unsat-cores true)
(assert (! (= (_ bv0 1) (_ bv1 1)) :named a))

(check-sat)
(get-unsat-core)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    (a)
---*)
