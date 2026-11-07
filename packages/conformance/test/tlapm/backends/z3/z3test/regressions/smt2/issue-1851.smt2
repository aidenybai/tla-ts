(*---
description: z3test's regression regressions/smt2/issue-1851.smt2.
ref: regressions/smt2/issue-1851.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :opt.priority lex)
(set-option :produce-models true)

(declare-fun s1 () Bool)
(declare-fun s2 () Bool)
(declare-fun s3 () Bool)
(declare-fun s4 () Bool)
(declare-fun q1 () Real)
(declare-fun q2 () Real)
(declare-fun q3 () Real)


(assert (<= 1.0 q1))
(assert (<= 0.0 q2))

(assert (<= 3.0 q3))

(assert (<= q1 q2))

(assert (<= (* 100000000000000000000000000000 q2) q3 ))

(minimize q1)
(minimize q2)
(minimize q3)

(check-sat)
(get-objectives)
;(get-model)
;(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (q1 1)
     (q2 1)
     (q3 100000000000000000000000000000)
    )
---*)
