(*---
description: z3test's regression regressions/smt2/issue-1677.smt2.
ref: regressions/smt2/issue-1677.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2016 Microsoft Corporation
(set-option :produce-models true)
(declare-const a_0 String)
(declare-const b_0 String)
(declare-const c_0 String)
(assert (not (= b_0 "")))
(assert (not (not (= (str.++ a_0 b_0) "abcd"))))
(assert (= (str.++ b_0 c_0) "cdef"))
(declare-const _o0 (_ BitVec 64))
(assert (= _o0 #x0000000000000002))
(minimize _o0)
(check-sat)
(eval a_0)
(eval b_0)
(eval c_0)
(eval _o0)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    "ab"
    "cd"
    "ef"
    #x0000000000000002
---*)
