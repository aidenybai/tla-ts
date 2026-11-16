(*---
description: z3test's regression regressions/smt2/sub.smt2.
ref: regressions/smt2/sub.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const a Int)
(declare-const b Int)

(set-option :pp.flat-assoc false)

(simplify (- 8 4 1))
(display (- 8 4 1))
(display (- a b 10 a))
(display (- 8.0 4.0 1.0))

(*--- recorded
all:
  exit: 0
  transcript: |-
    3
    (- (- 8 4) 1)
    (- (- (- a b) 10) a)
    (- (- 8.0 4.0) 1.0)
---*)
