(*---
description: z3test's regression regressions/smt2/fp-rounding_mode-3.smt2.
ref: regressions/smt2/fp-rounding_mode-3.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2015 Microsoft Corporation

(set-logic QF_FP)
(set-info :status sat)

(declare-fun rm1 () (RoundingMode))
(declare-fun rm2 () (RoundingMode))

(assert (not (= rm1 rm2)))

(check-sat)
(check-sat-using smt)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
