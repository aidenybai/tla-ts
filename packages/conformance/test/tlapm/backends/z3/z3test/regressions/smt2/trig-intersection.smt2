(*---
description: z3test's regression regressions/smt2/trig-intersection.smt2.
ref: regressions/smt2/trig-intersection.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2016 Microsoft Corporation

(set-info :source |Written by D. B. Staple for GitHub issue #680.|)
(set-info :status sat)

(declare-fun theta () Real)
(assert (= (sin theta) (cos theta)))
(check-sat-using qfnra-nlsat)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (
      (define-fun theta () Real
        (+ (acos (root-obj (+ (* 2 (^ x 2)) (- 1)) 2)) pi))
    )
---*)
