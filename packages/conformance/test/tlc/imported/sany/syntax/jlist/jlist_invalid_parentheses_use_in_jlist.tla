(*---
description: Invalid parentheses use in jlist. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/jlist.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE jlist_invalid_parentheses_use_in_jlist ----
op ==
    /\ 1
    /\ (2
)
    /\ 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Item at line 12, col 1 to line 12, col 1 of module jlist_invalid_parentheses_use_in_jlist is not properly indented inside conjunction or  disjunction list item at line 11, col 5 to line 12, col 1 of module jlist_invalid_parentheses_use_in_jlist
    | Residual stack trace follows:
    | AND-OR Junction starting at line 10, column 5.
    | ExtendableExpr starting at line 10, column 5.
    | Expression starting at line 10, column 5.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file jlist_invalid_parentheses_use_in_jlist
    | In module jlist_invalid_parentheses_use_in_jlist
    | Could not parse module jlist_invalid_parentheses_use_in_jlist from file jlist_invalid_parentheses_use_in_jlist.tla
    | *** Errors: 1
    | In module jlist_invalid_parentheses_use_in_jlist
    | Could not parse module jlist_invalid_parentheses_use_in_jlist from file jlist_invalid_parentheses_use_in_jlist.tla
    3002:1 Parsing or semantic analysis failed.
---*)
