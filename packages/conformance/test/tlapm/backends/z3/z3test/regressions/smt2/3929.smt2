(*---
description: z3test's regression regressions/smt2/3929.smt2.
ref: regressions/smt2/3929.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.threads 7)
(set-option :model_validate true)
(set-option :smt.arith.solver 2)
(declare-fun a () String)
(assert (str.in.re a (re.++ (re.* (str.to.re "a")) (re.* (str.to.re "b")) (re.range "a" "u"))))
(assert (str.in.re a (re.++ (re.* (str.to.re "a")) (str.to.re "b"))))
(check-sat)
(reset)
(set-option :smt.threads 3)
(set-option :model_validate true)
(set-option :smt.arith.solver 2)
(declare-fun a () String)
(assert (str.in.re a (re.++ (re.* (str.to.re "a")) (re.* (str.to.re "b")) (re.range "a" "u"))))
(assert (str.in.re a (re.++ (re.* (str.to.re "a")) (str.to.re "b"))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
