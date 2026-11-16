(*---
description: Infix Op Disjlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/disjlist.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE disjlist_infix_op_disjlist ----
op ==
 \/ 1
  + 2 
 \/ 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 3 to line 11, col 3 of module disjlist_infix_op_disjlist
    | Could not find declaration or definition of symbol '+'.
    | line 10, col 5 to line 11, col 5 of module disjlist_infix_op_disjlist
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
