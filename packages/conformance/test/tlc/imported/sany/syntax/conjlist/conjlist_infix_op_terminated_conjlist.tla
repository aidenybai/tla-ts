(*---
description: Infix Op Terminated Conjlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/conjlist.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE conjlist_infix_op_terminated_conjlist ----
op ==
 /\ 1
 + 2 
 /\ 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 2 to line 11, col 2 of module conjlist_infix_op_terminated_conjlist
    | Could not find declaration or definition of symbol '+'.
    | line 10, col 2 to line 11, col 4 of module conjlist_infix_op_terminated_conjlist
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
