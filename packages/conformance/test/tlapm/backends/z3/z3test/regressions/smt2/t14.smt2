(*---
description: z3test's regression regressions/smt2/t14.smt2.
ref: regressions/smt2/t14.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-logic QF_UFLIA)

(declare-fun real_of_int (Int) Real)
(declare-fun a () (Array Int Int))

(reset)

(set-logic QF_UF)

(declare-fun x () Int)

(reset)

(set-logic QF_AUFLIA)
(declare-fun a () (Array Int Int))
(declare-fun l () (List Int))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 6 column 35: logic does not support reals")
    (error "line 7 column 19: unknown sort 'Array'")
    (error "line 13 column 18: Invalid function declaration: unknown sort 'Int'")
    (error "line 19 column 19: unknown sort 'List'")
---*)
