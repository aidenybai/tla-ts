(*---
description: CASE Separator Across Open Parenthesis in Disjunction List. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/case.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE case_case_separator_across_open_parenthesis_in_disjunction_list ----
op ==
  CASE A ->
    \/ (CASE B -> C
  [] D -> E)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "[]" at line 12, column 3 and token "C" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 11, column 8.
    | Expression starting at line 11, column 8.
    | Junction Item starting at line 11, column 5.
    | AND-OR Junction starting at line 11, column 5.
    | ExtendableExpr starting at line 11, column 5.
    | Fatal errors while parsing TLA+ spec in file case_case_separator_across_open_parenthesis_in_disjunction_list
    | In module case_case_separator_across_open_parenthesis_in_disjunction_list
    | Could not parse module case_case_separator_across_open_parenthesis_in_disjunction_list from file case_case_separator_across_open_parenthesis_in_disjunction_list.tla
    | *** Errors: 1
    | In module case_case_separator_across_open_parenthesis_in_disjunction_list
    | Could not parse module case_case_separator_across_open_parenthesis_in_disjunction_list from file case_case_separator_across_open_parenthesis_in_disjunction_list.tla
    3002:1 Parsing or semantic analysis failed.
---*)
