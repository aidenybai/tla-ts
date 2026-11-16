(*---
description: z3test's regression regressions/smt2/4004.smt2.
ref: regressions/smt2/4004.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(set-option :smt.arith.solver 6)
(declare-const Str7 String)
(declare-const Str16 String)
(declare-const v1 Bool)
(assert (! (or (or v1 (str.contains Str7 Str16) (= 45 0)) (or v1 (str.contains Str7 Str16) (= 45 0)) (or v1 (str.contains Str7 Str16) (= 45 0)) (or v1 (str.contains Str7 Str16) (= 45 0))) :named IP_3))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
