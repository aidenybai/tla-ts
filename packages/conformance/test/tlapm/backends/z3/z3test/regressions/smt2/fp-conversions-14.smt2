(*---
description: z3test's regression regressions/smt2/fp-conversions-14.smt2.
ref: regressions/smt2/fp-conversions-14.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X ()  (_ FloatingPoint 11 53))

; more small floats, 10 = +1.25p3
(declare-fun T () (_ FloatingPoint 3 3))
(assert (= T ((_ to_fp 3 3) RTZ #x000A))) 
(assert (= T (fp #b0 #b110 #b01)))

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
