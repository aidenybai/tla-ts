(*---
description: z3test's regression regressions/smt2/bad_set_logic.smt2.
ref: regressions/smt2/bad_set_logic.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :smtlib2-compliant true)
(set-logic Q)

(*--- recorded
all:
  exit: 0
  transcript: |-
    success
    unsupported
    ; ignoring unsupported logic Q line: 5 position: 0
---*)
