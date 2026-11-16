(*---
description: z3test's regression regressions/smt2/consequences.smt2.
ref: regressions/smt2/consequences.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const a Bool)
(declare-const b Bool)
(declare-const c Bool)
(declare-const d Bool)
(declare-const e Bool)

(assert (=> a b))
(assert (=> b c))

(get-consequences ((not c) d) (a b c d c))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat

    (=> d d)
    (=> (not c) (not c))
    (=> (not c) (not b))
    (=> (not c) (not a))
---*)
