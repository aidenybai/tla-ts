(*---
description: z3test's regression regressions/smt2/fp-to_sbv-8.smt2.
ref: regressions/smt2/fp-to_sbv-8.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2015 Microsoft Corporation

(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-const X (_ FloatingPoint 5 11))
(declare-const B (_ BitVec 8))

; 1.9921875p6 == 127.5 -> unspecified because of RTP
(assert (= X (fp #b0 #b10101 #b1111111000)))
(assert (= B ((_ fp.to_sbv 8) RTP X)))
(assert (not (= B #x00)))

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
