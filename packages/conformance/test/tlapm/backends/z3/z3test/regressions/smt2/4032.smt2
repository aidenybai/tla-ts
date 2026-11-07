(*---
description: z3test's regression regressions/smt2/4032.smt2.
ref: regressions/smt2/4032.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-const Str1 String)
(declare-const Str11 String)
(assert (str.< (str.++ "" "" "nsvskw" Str1) Str11))
(check-sat-using (then simplify qfufbv_ackr))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
