(*---
description: z3test's regression regressions/smt2/strategy-par-or-1.smt2.
ref: regressions/smt2/strategy-par-or-1.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2016 Microsoft Corporation 

(set-info :source |Written by D. B. Staple for GitHub issue #623.|)
(set-info :status sat)

(declare-fun n () Int)
(assert (not (< n 1)))
(check-sat-using (par-or qflia smt))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
