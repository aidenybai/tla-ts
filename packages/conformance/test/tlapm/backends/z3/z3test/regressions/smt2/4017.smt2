(*---
description: z3test's regression regressions/smt2/4017.smt2.
ref: regressions/smt2/4017.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () String)
(declare-fun b () String)
(assert (str.in.re a (re.++ (re.* (re.union (str.to.re "z") (str.to.re "a"))) (str.to.re "a"))))
(assert (not (str.in.re (str.++ "b" b) (re.inter (re.* (re.+ (str.to.re ""))) (str.to.re "b")))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
