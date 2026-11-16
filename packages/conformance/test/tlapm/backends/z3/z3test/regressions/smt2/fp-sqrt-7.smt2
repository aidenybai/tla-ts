(*---
description: z3test's regression regressions/smt2/fp-sqrt-7.smt2.
ref: regressions/smt2/fp-sqrt-7.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status unsat)

(declare-fun X () Float16)
(declare-fun R () Float16)

(assert (not (= X (_ -zero 5 11))))
(assert (= R (fp.sqrt RNE X)))
(assert (fp.isNegative R))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
