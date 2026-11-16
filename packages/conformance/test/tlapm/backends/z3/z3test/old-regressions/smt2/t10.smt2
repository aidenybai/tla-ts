(*---
description: z3test's regression old-regressions/smt2/t10.smt2.
ref: old-regressions/smt2/t10.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config false)
(set-option :produce-unsat-cores true)
(set-logic QF_UF)
(declare-fun p () Bool)
(declare-fun q () Bool)
(declare-fun r () Bool)
(declare-fun s () Bool)
(declare-fun t () Bool)
(assert (! (=> p q) :named PQ))
(assert (! (=> q r) :named QR))
(assert (! (=> r s) :named RS))
(assert (! (=> s t) :named ST))
(assert (! (not (=> q s)) :named NQS))
(check-sat)
(get-unsat-core)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    (QR RS NQS)
---*)
