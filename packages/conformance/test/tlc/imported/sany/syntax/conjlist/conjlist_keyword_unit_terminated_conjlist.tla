(*---
description: Keyword-Unit-Terminated Conjlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/conjlist.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE conjlist_keyword_unit_terminated_conjlist ----
op1 ==
  /\ 1
  /\ 2
      ASSUME x

op2 ==
  /\ 3
  /\ 4
      LOCAL INSTANCE ModuleName

op3 ==
  /\ 5
  /\ 6
      -----------------

op4 ==
  /\ 7
  /\ 8
      ---- MODULE Nested ----
      ====

op5 ==
  /\ 9
  /\ 10
      VARIABLES x, y
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file conjlist_keyword_unit_terminated_conjlist
    | In module conjlist_keyword_unit_terminated_conjlist
    | Cannot find source file for module ModuleName imported in module conjlist_keyword_unit_terminated_conjlist.
    | *** Errors: 1
    | In module conjlist_keyword_unit_terminated_conjlist
    | Cannot find source file for module ModuleName imported in module conjlist_keyword_unit_terminated_conjlist.
    3002:1 Parsing or semantic analysis failed.
---*)
