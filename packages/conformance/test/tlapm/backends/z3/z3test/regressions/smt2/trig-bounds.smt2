(*---
description: z3test's regression regressions/smt2/trig-bounds.smt2.
ref: regressions/smt2/trig-bounds.smt2
features:
  - z3test
outcome: unsat
---*)
;; Copyright (c) 2016 Microsoft Corporation

(set-info :source |Written by D. B. Staple for GitHub issue #680.|)
(set-info :status unsat)

(declare-fun theta () Real)
(assert (< (sin theta) -1.0))
(check-sat-using qfnra-nlsat)
(reset)

(declare-fun theta () Real)
(assert (> (sin theta) 1.0))
(check-sat-using qfnra-nlsat)
(reset)

(declare-fun theta () Real)
(assert (< (cos theta) -1.0))
(check-sat-using qfnra-nlsat)
(reset)

(declare-fun theta () Real)
(assert (> (sin theta) 1.0))
(check-sat-using qfnra-nlsat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
    unsat
    unsat
---*)
