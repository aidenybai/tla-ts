(*---
description: Jlists Containing Colon-Prefixed Infix Operators (GH87). Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/jlist.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE jlist_jlists_containing_colon_prefixed_infix_operators_gh87 ----
conj ==
  /\ lbl :: A
  /\ B := C
  /\ D ::= E

disj ==
  \/ lbl :: A
  \/ B := C
  \/ D ::= E
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 10
    | line 10, col 13 to line 10, col 13 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Unknown operator: `A'.
    | line 11, col 8 to line 11, col 9 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Could not find declaration or definition of symbol ':='.
    | line 11, col 6 to line 11, col 11 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Couldn't resolve infix operator symbol `:='.
    | line 12, col 8 to line 12, col 10 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Could not find declaration or definition of symbol '::='.
    | line 12, col 6 to line 12, col 12 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Couldn't resolve infix operator symbol `::='.
    | line 15, col 13 to line 15, col 13 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Unknown operator: `A'.
    | line 16, col 8 to line 16, col 9 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Could not find declaration or definition of symbol ':='.
    | line 16, col 6 to line 16, col 11 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Couldn't resolve infix operator symbol `:='.
    | line 17, col 8 to line 17, col 10 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Could not find declaration or definition of symbol '::='.
    | line 17, col 6 to line 17, col 12 of module jlist_jlists_containing_colon_prefixed_infix_operators_gh87
    | Couldn't resolve infix operator symbol `::='.
    3002:1 Parsing or semantic analysis failed.
---*)
