(*---
description: CASE Separator Without Outer CASE in Conjunction List. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/case.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE case_case_separator_without_outer_case_in_conjunction_list ----
op ==
  /\ CASE A -> B
  [] C -> D
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "[]" at line 11, column 3 and token "B" 
    | Residual stack trace follows:
    | Module definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file case_case_separator_without_outer_case_in_conjunction_list
    | In module case_case_separator_without_outer_case_in_conjunction_list
    | Could not parse module case_case_separator_without_outer_case_in_conjunction_list from file case_case_separator_without_outer_case_in_conjunction_list.tla
    | *** Errors: 1
    | In module case_case_separator_without_outer_case_in_conjunction_list
    | Could not parse module case_case_separator_without_outer_case_in_conjunction_list from file case_case_separator_without_outer_case_in_conjunction_list.tla
    3002:1 Parsing or semantic analysis failed.
---*)
