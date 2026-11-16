(*---
description: z3test's regression regressions/smt2/t180.smt2.
ref: regressions/smt2/t180.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a1 Int)
(declare-const a2 Int)
(declare-const a3 Int)

(display (= 1 2 3 4 5 6))
(display (= a1 a2 a3 a3))
(simplify (= a1 a2 a3 a3))

(declare-const p1 Bool)
(declare-const p2 Bool)
(declare-const p3 Bool)
(display (=> p1 p2 p3))
(simplify (=> p1 p2 p3))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (and (= 1 2) (= 2 3) (= 3 4) (= 4 5) (= 5 6))
    (and (= a1 a2) (= a2 a3) (= a3 a3))
    (and (= a1 a2) (= a2 a3))
    (=> p1 (=> p2 p3))
    (or p3 (not p2) (not p1))
---*)
