(*---
description: z3test's regression regressions/smt2/fp-array-2.smt2.
ref: regressions/smt2/fp-array-2.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2015 Microsoft Corporation

(set-info :status sat)
(set-info :source |Handcrafted by Christoph M. Wintersteiger (cwinter@microsoft.com).|)

(declare-fun A () (Array Int (_ FloatingPoint 11 53)))

(assert (fp.eq (select A 0) (select A 1)))

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
