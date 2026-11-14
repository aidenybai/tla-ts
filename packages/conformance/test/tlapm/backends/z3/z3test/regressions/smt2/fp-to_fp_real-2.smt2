(*---
description: z3test's regression regressions/smt2/fp-to_fp_real-2.smt2.
ref: regressions/smt2/fp-to_fp_real-2.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-const X (_ FloatingPoint 8 24))
(declare-const R Real)

(assert (= R 2.0))
(assert (= X ((_ to_fp 8 24) RTZ R)))
(assert (not (= X ((_ to_fp 8 24) RTZ 2.0))))

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
