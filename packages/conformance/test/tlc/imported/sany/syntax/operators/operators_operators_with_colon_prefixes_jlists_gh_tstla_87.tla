(*---
description: "Operators with Colon Prefixes & Jlists (GH TSTLA #87). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/operators.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_operators_with_colon_prefixes_jlists_gh_tstla_87 ----
op ==
  /\ A :> B
  /\ A := B
  /\ A ::= B
  /\ A :: B
  /\ A
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 8
    | line 10, col 8 to line 10, col 9 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Could not find declaration or definition of symbol ':>'.
    | line 10, col 6 to line 10, col 11 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Couldn't resolve infix operator symbol `:>'.
    | line 11, col 8 to line 11, col 9 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Could not find declaration or definition of symbol ':='.
    | line 11, col 6 to line 11, col 11 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Couldn't resolve infix operator symbol `:='.
    | line 12, col 8 to line 12, col 10 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Could not find declaration or definition of symbol '::='.
    | line 12, col 6 to line 12, col 12 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Couldn't resolve infix operator symbol `::='.
    | line 13, col 11 to line 13, col 11 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Unknown operator: `B'.
    | line 14, col 6 to line 14, col 6 of module operators_operators_with_colon_prefixes_jlists_gh_tstla_87
    | Unknown operator: `A'.
    3002:1 Parsing or semantic analysis failed.
---*)
