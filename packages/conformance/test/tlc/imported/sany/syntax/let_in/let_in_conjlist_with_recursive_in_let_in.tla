(*---
description: Conjlist with RECURSIVE in LET/IN. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/let_in.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE let_in_conjlist_with_recursive_in_let_in ----
op ==
  /\ LET RECURSIVE f IN P
  /\ Q
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 10, col 20 to line 10, col 20 of module let_in_conjlist_with_recursive_in_let_in
    | Symbol f declared in RECURSIVE statement but not defined.
    | line 10, col 25 to line 10, col 25 of module let_in_conjlist_with_recursive_in_let_in
    | Unknown operator: `P'.
    | line 11, col 6 to line 11, col 6 of module let_in_conjlist_with_recursive_in_let_in
    | Unknown operator: `Q'.
    3002:1 Parsing or semantic analysis failed.
---*)
