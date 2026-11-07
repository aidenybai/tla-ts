(*---
description: z3test's regression regressions/smt2/fp-conversions-12.smt2.
ref: regressions/smt2/fp-conversions-12.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X ()  (_ FloatingPoint 11 53))

; downcast Float64 -> Float32
(declare-fun S () (Float32))
(assert (= S ((_ to_fp 8 24) roundTowardZero S)))
(assert (= X ((_ to_fp 11 53) #x0000000000000000)))
(assert (not (= X (fp #b0 #b00000000000 #x0000000000000))))

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
