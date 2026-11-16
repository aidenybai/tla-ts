(*---
description: z3test's regression regressions/smt2/fp-to_sbv-1.smt2.
ref: regressions/smt2/fp-to_sbv-1.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ BitVec 8))
(assert (= X ((_ fp.to_sbv 8) RTZ (fp #b1 #b01111 #b0000000000)))) ; -1.0
(assert (not (= X #xff)))

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
