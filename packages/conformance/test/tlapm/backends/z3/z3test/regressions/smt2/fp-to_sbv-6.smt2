(*---
description: z3test's regression regressions/smt2/fp-to_sbv-6.smt2.
ref: regressions/smt2/fp-to_sbv-6.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2015 Microsoft Corporation

(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; -oo -> unspecified
(assert (not (= #x00 ((_ fp.to_sbv 8) RTP (_ -oo 5 11)))))

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
