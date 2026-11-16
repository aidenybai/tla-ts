(*---
description: z3test's regression regressions/smt2/z3.15.smt2.
ref: regressions/smt2/z3.15.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(declare-datatypes (T) ((Lst nil (cons (hd T) (tl Lst)))))
(declare-const l1 (Lst Int))
(declare-const l2 (Lst Bool))

(*--- recorded
all:
  exit: 0
---*)
