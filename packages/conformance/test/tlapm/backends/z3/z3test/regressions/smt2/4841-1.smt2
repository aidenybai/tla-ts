(*---
description: z3test's regression regressions/smt2/4841-1.smt2.
ref: regressions/smt2/4841-1.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat)

(declare-fun X () (_ FloatingPoint 2 6))
(declare-fun Y () (_ FloatingPoint 2 6))
(declare-fun Z () (_ FloatingPoint 2 6))
(assert (and
  (= X (fp.add RTZ Y Z))
  (= X (fp.div RTZ Y Z))
  (= X (fp.roundToIntegral RTZ Y))
  (not (= Y Z))))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
