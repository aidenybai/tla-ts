(*---
description: z3test's regression regressions/parameters/tactic_params_validation4.smt2.
ref: regressions/parameters/tactic_params_validation4.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(check-sat-using (using-params smt :arith.nl.rounds 1)) ; correct 
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
