(*---
description: z3test's regression regressions/smt2/fp-conversions-24.smt2.
ref: regressions/smt2/fp-conversions-24.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X ()  (_ FloatingPoint 11 53))

(declare-fun C () (Float64))
; - 1 = -1p0
(assert (= C ((_ to_fp 11 53) RTZ #xFFFF))) 
(assert (= C (fp #b1 #b01111111111 #x0000000000000)))

(check-sat)
(check-sat-using smt)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
