(*---
description: z3test's regression old-regressions/smt2/t282.smt2.
ref: old-regressions/smt2/t282.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :produce-unsat-cores true)

(declare-fun f (Int) Int)

(assert (! (>= (f 0) 0) :named |a (b)|))
(assert (! (>= (f 0) 1) :named c))
(assert (! (< (f 0) 0) :named d))
(check-sat)
(get-unsat-core)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    (|a (b)| d)
---*)
