(*---
description: z3test's regression regressions/smt2/fp-to_ubv-30.smt2.
ref: regressions/smt2/fp-to_ubv-30.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2015 Microsoft Corporation

(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; X = 2^8 = 256 -> (_ fp.to_ubv 8) is unspecified

(declare-const X (_ FloatingPoint 5 11))
(assert (= X (fp #b0 #b10111 #b0000000000)))

(declare-const B (_ BitVec 8))
(assert (= B ((_ fp.to_ubv 8) RTP X)))
(assert (= B #x42))

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
