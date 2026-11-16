(*---
description: Keyword-Unit-Terminated Disjlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/disjlist.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE disjlist_keyword_unit_terminated_disjlist ----
op1 ==
  \/ 1
  \/ 2
      ASSUME x

op2 ==
  \/ 3
  \/ 4
      LOCAL INSTANCE ModuleName

op3 ==
  \/ 5
  \/ 6
      -----------------

op4 ==
  \/ 7
  \/ 8
      ---- MODULE Nested ----
      ====

op5 ==
  \/ 9
  \/ 10
      VARIABLES x, y
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file disjlist_keyword_unit_terminated_disjlist
    | In module disjlist_keyword_unit_terminated_disjlist
    | Cannot find source file for module ModuleName imported in module disjlist_keyword_unit_terminated_disjlist.
    | *** Errors: 1
    | In module disjlist_keyword_unit_terminated_disjlist
    | Cannot find source file for module ModuleName imported in module disjlist_keyword_unit_terminated_disjlist.
    3002:1 Parsing or semantic analysis failed.
---*)
