(*---
description: z3test's regression regressions/smt2/4033.smt2.
ref: regressions/smt2/4033.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-const Str3 String)
(declare-const Str10 String)
(assert (str.< (str.++ "fe" Str10) Str3))
(check-sat)
(exit)

(reset)
(set-option :model_validate true)
(declare-const Str3 String)
(declare-const Str13 String)
(assert (str.< (str.++ "" "" "" "fytvsj" Str3) Str13))
(check-sat)

(reset)
(set-option :model_validate true)
(declare-const Str8 String)
(declare-const Str12 String)
(assert (str.< (str.++ "" "thonkj" "" Str12) Str8))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
