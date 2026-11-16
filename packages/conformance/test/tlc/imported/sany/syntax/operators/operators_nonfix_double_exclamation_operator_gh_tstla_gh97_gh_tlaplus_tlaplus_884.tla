(*---
description: "Nonfix Double Exclamation Operator (GH TSTLA #GH97, GH tlaplus/tlaplus #884). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/operators.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884 ----
op == A!!!(1,2)
op == A!B!!!(1,2)
op == A!!! !!!(1,2)
op == !! !!! !!! !!! !!!(1,2)
op == A !! B
op ==
  /\ A
  /\ B
  !! C
op ==
  /\ A
  /\ B
   !! C
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "!" at line 9, column 10 and token "!!" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 10.
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884
    | In module operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884
    | Could not parse module operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884 from file operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884.tla
    | *** Errors: 1
    | In module operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884
    | Could not parse module operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884 from file operators_nonfix_double_exclamation_operator_gh_tstla_gh97_gh_tlaplus_tlaplus_884.tla
    3002:1 Parsing or semantic analysis failed.
---*)
