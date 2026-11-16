(*---
description: RECURSIVE inside LET/IN. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/let_in.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE let_in_recursive_inside_let_in ----
op ==
  LET
    RECURSIVE f(_)
    f(n) == IF n =< 0 THEN 1 ELSE n * f(n-1)
  IN f(5)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 12, col 18 to line 12, col 19 of module let_in_recursive_inside_let_in
    | Could not find declaration or definition of symbol '=<'.
    | line 12, col 16 to line 12, col 21 of module let_in_recursive_inside_let_in
    | Couldn't resolve infix operator symbol `=<'.
    | line 12, col 37 to line 12, col 37 of module let_in_recursive_inside_let_in
    | Could not find declaration or definition of symbol '*'.
    | line 12, col 35 to line 12, col 44 of module let_in_recursive_inside_let_in
    | Couldn't resolve infix operator symbol `*'.
    3002:1 Parsing or semantic analysis failed.
---*)
