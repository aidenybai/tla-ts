(*---
description: z3test's regression regressions/smt2/3967.smt2.
ref: regressions/smt2/3967.smt2
features:
  - z3test
outcome: sat
---*)

(set-option :model_validate true)
(set-option :model_validate true)
(declare-const Str2 String)
(declare-const Str18 String)
(assert (distinct Str18 Str2))
(check-sat)
(exit)

(declare-const Str0 String)
(declare-const Str2 String)
(declare-const Str4 String)
(declare-const Str12 String)
(assert (not (= Str4 Str12 Str2 Str0 Str2)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
