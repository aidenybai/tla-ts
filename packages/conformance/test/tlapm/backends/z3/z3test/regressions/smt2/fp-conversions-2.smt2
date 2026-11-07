(*---
description: z3test's regression regressions/smt2/fp-conversions-2.smt2.
ref: regressions/smt2/fp-conversions-2.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 11 53))

(assert (fp.eq X (fp #b0 #b10101010101 #x1234567890abc)))
(assert (not (= X (fp #b0 #b10101010101 #x1234567890abc))))

(check-sat)
(check-sat-using smt)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
