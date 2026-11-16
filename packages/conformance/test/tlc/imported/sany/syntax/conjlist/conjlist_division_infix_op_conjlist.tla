(*---
description: Division Infix Op Conjlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/conjlist.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE conjlist_division_infix_op_conjlist ----
op ==
 /\ 1
  / 2 
 /\ 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 3 to line 11, col 3 of module conjlist_division_infix_op_conjlist
    | Could not find declaration or definition of symbol '/'.
    | line 10, col 5 to line 11, col 5 of module conjlist_division_infix_op_conjlist
    | Couldn't resolve infix operator symbol `/'.
    3002:1 Parsing or semantic analysis failed.
---*)
