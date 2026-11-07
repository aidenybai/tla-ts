(*---
description: z3test's regression old-regressions/smt2/t32.smt2.
ref: old-regressions/smt2/t32.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config false)
(get-option :auto-config)
(set-logic QF_UFLIA)
(declare-fun v2 () Int)
(declare-fun v1 () Int)
(push 1)
(assert (= v2 v1))
(push 1)
(assert (not (= v2 v1)))
(check-sat)
(pop 1)
(pop 1)
(assert (not (= v2 v1)))
(check-sat)

(reset)

(set-option :auto-config true)
(get-option :auto-config)
(set-logic QF_UFLIA)
(declare-fun v2 () Int)
(declare-fun v1 () Int)
(push 1)
(assert (= v2 v1))
(push 1)
(assert (not (= v2 v1)))
(check-sat)
(pop 1)
(pop 1)
(assert (not (= v2 v1)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    false
    unsat
    sat
    true
    unsat
    sat
---*)
