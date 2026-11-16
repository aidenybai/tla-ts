(*---
description: z3test's regression regressions/smt2/fp-rounding_mode-2.smt2.
ref: regressions/smt2/fp-rounding_mode-2.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2015 Microsoft Corporation

(set-logic QF_FP)
(set-info :status sat)

(declare-fun rm () (RoundingMode))

(assert (distinct rm roundNearestTiesToEven))

(check-sat)
(check-sat-using smt)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
