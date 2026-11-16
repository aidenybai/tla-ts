(*---
description: z3test's regression regressions/smt2/fp-conversions-27.smt2.
ref: regressions/smt2/fp-conversions-27.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X ()  (_ FloatingPoint 11 53))

(declare-fun C () (Float64))
; +16 = +1p4
(assert (= C ((_ to_fp 11 53) RTZ #x0000000000000010))) 
(assert (= C (fp #b0 #b10000000011 #x0000000000000)))

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
