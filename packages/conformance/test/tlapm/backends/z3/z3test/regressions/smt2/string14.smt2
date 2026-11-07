(*---
description: z3test's regression regressions/smt2/string14.smt2.
ref: regressions/smt2/string14.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2017 Microsoft Corporation
; issue #1015

(set-option :smt.string_solver seq) 
(declare-fun s() String)
(assert (= "\u{80}" s))
(check-sat)
(get-value (s))
(assert (= (str.len s) 1))
(check-sat)
(declare-fun c() String)
(assert (= (str.at s 0) c))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    ((s "\u{80}"))
    sat
    sat
---*)
