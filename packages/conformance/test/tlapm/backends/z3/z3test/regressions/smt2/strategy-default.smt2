(*---
description: z3test's regression regressions/smt2/strategy-default.smt2.
ref: regressions/smt2/strategy-default.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2016 Microsoft Corporation 

(set-info :source |Written by D. B. Staple to test export of default tactic.|)
(set-info :status sat)

(declare-fun x () Real)
(declare-fun y () Real)
(assert (= x (* y y)))

(check-sat-using default)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
