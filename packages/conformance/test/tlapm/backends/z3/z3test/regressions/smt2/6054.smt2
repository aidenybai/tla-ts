(*---
description: z3test's regression regressions/smt2/6054.smt2.
ref: regressions/smt2/6054.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(declare-fun v () Int)
(declare-fun a () Int)
(assert (distinct true (= "" (str.replace (str.substr "A" 0 a) "" (str.substr "A" 0 v)))))
(check-sat)
(reset)

(set-logic ALL)
(declare-fun v () Int)
(declare-fun a () Int)
(assert (= "" (str.replace (str.substr "A" 0 v) "" (str.substr "A" 0 a))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
