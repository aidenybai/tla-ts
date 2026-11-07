(*---
description: z3test's regression regressions/smt2/fp-to_ubv-31.smt2.
ref: regressions/smt2/fp-to_ubv-31.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; X = 0.52682650089263916015625 -> #b00000001

(declare-const X (_ FloatingPoint 8 24))
(assert (= X ((_ to_fp 8 24) roundNearestTiesToEven (/ 4419341 8388608))))

(declare-const B (_ BitVec 32))
(assert (= B ((_ fp.to_ubv 32) RTP X))) 

(assert (not (= B #x00000001)))

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
