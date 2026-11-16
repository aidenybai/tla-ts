(*---
description: z3test's regression regressions/smt2/3984.smt2.
ref: regressions/smt2/3984.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :trace true)
(check-sat-using default)
(reset-assertions)
(declare-fun a () Int)
(check-sat-using default)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
