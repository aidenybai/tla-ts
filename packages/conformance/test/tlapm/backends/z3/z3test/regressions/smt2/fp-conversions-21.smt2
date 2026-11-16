(*---
description: z3test's regression regressions/smt2/fp-conversions-21.smt2.
ref: regressions/smt2/fp-conversions-21.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X ()  (_ FloatingPoint 11 53))

 ; +4503599627370495 = 2^52-1 = +1.99?p51
(assert (= X ((_ to_fp 11 53) RNE #x00FFFFFFFFFFFFF)))
(assert (= X (fp #b0 #b10000110010 #xFFFFFFFFFFFFE)))

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
