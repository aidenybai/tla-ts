(*---
description: z3test's regression regressions/smt2/trig-spherical.smt2.
ref: regressions/smt2/trig-spherical.smt2
features:
  - z3test
outcome: unsat
---*)
;; Copyright (c) 2016 Microsoft Corporation

(set-info :source |Written by D. B. Staple for GitHub issue #680.|)
(set-info :status unsat)

(declare-fun x () Real)
(declare-fun y () Real)
(declare-fun z () Real)
(declare-fun r () Real)
(declare-fun theta () Real)
(declare-fun phi () Real)
(assert (= x (* r (* (sin theta) (cos phi)))))
(assert (= y (* r (* (sin theta) (sin phi)))))
(assert (= z (* r (cos theta))))
(assert (distinct (* r r) (+ (* x x) (+ (* y y) (* z z)))))
(check-sat-using qfnra-nlsat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
