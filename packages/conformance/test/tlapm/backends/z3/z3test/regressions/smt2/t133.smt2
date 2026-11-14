(*---
description: z3test's regression regressions/smt2/t133.smt2.
ref: regressions/smt2/t133.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-logic QF_RDL)
(declare-fun x () Real)
(declare-fun y () Int)

(reset)
(set-logic QF_IDL)
(declare-fun x () Int)
(declare-fun y () Real)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 7 column 21: logic does not support integers")
    (error "line 12 column 22: logic does not support reals")
---*)
