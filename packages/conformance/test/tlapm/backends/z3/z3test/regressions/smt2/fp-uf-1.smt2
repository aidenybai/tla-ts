(*---
description: z3test's regression regressions/smt2/fp-uf-1.smt2.
ref: regressions/smt2/fp-uf-1.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)

(declare-fun f (Int) (_ FloatingPoint 53 11))

(assert (= (f 1) (_ +oo 53 11)))
(assert (= (f 1) (_ -oo 53 11)))

(check-sat)
(check-sat-using smt)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
