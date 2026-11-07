(*---
description: z3test's regression regressions/smt2/fp-to_fp-8.smt2.
ref: regressions/smt2/fp-to_fp-8.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 5 11))

(assert (= X ((_ to_fp 5 11) RTN #x7FFFFFFF))) ; +2147483647 --> +1.9990234375p15 (last normal pos number for 5/11)
(assert (not (= X ((_ to_fp 5 11) RTZ 1.9990234375 15))))

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
