(*---
description: z3test's regression regressions/smt2/fp-lt-gt.smt2.
ref: regressions/smt2/fp-lt-gt.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 11 53))
(declare-fun Y () (_ FloatingPoint 11 53))

(assert (fp.lt X Y))
(assert (not (fp.gt X Y)))

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
