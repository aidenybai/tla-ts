(*---
description: z3test's regression regressions/smt2/fp-conversions-29.smt2.
ref: regressions/smt2/fp-conversions-29.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X ()  (_ FloatingPoint 11 53))

(declare-fun C () (Float64))
; +4503599627370495 = +1.99?p52 = 2^52-1
(assert (= C ((_ to_fp 11 53) RNA #x000FFFFFFFFFFFFF))) 
(assert (= C (fp #b0 #b10000110010 #xFFFFFFFFFFFFE)))

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
