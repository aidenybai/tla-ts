(*---
description: z3test's regression regressions/smt2/t148.smt2.
ref: regressions/smt2/t148.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-datatypes (T) ((lst nil (const (car T) (cdr mylist)))))

(*--- recorded
all:
  exit: 0
  transcript: '(error "line 5 column 19: invalid datatype declaration, unknown sort ''mylist''")'
---*)
