(*---
description: z3test's regression regressions/smt2/fp-operations.smt2.
ref: regressions/smt2/fp-operations.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 2 6))
(declare-fun Y () (_ FloatingPoint 2 6))
(declare-fun Z () (_ FloatingPoint 2 6))
(declare-fun W () (_ FloatingPoint 2 6))

(assert
  (or
    (= X (fp.add RTZ Y Z))
    (= X (fp.sub RTZ Y Z))
    (= X (fp.mul RTZ Y Z))
    (= X (fp.div RTZ Y Z))
    (= X (fp.fma RTZ Y Z W))
    (= X (fp.sqrt RTZ Y))
    (= X (fp.rem X Y))
    (= X (fp.roundToIntegral RTZ Y))
    (= X (fp.min Y Z))
    (= X (fp.max Y Z))
  )
)

(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
