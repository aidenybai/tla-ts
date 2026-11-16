(*---
description: z3test's regression regressions/issues/5825.smt2.
ref: regressions/issues/5825.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(declare-fun v () String)
(declare-fun a () String)
(declare-fun x () String)
(assert (str.in_re (str.++ v "B") (re.* (str.to_re (str.substr a 0 (str.len x))))))
(assert (> (- (str.len x) 1 1) 0))
(check-sat)
(reset)

(declare-fun v () (Seq Int))
(declare-fun va () String)
(declare-fun r () String)
(declare-fun a () String)
(assert (str.in_re va (re.++ (str.to_re "A") re.allchar (str.to_re "A"))))
(push)
(check-sat)
(assert (and (seq.prefixof v (seq.unit 0)) (str.in_re (str.++ a "B") (re.* (str.to_re (str.substr r 0 (str.len a)))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    sat
---*)
