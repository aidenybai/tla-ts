(*---
description: z3test's regression regressions/smt2/issue-1086.smt2.
ref: regressions/smt2/issue-1086.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2018 Microsoft Corporation
; GitHub issue

(assert (forall ((b Int))
             (forall ((n Int))
                   (forall ((s Int))
                         (=> (and
                                (= (* 3 b) s)
                                (< 0 n)
                                )
                             (exists ((bb Int))
                                            (and (= (* 3 bb) s)
                                                 (< 0 n)
                                                 )))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
