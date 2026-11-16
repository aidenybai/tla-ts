(*---
description: Invalid LOCAL Declaration of RECURSIVE. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unit.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE unit_invalid_local_declaration_of_recursive ----
LOCAL RECURSIVE x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "LOCAL RECURSIVE" at line 9, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 9, column 1.
    | Module definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file unit_invalid_local_declaration_of_recursive
    | In module unit_invalid_local_declaration_of_recursive
    | Could not parse module unit_invalid_local_declaration_of_recursive from file unit_invalid_local_declaration_of_recursive.tla
    | *** Errors: 1
    | In module unit_invalid_local_declaration_of_recursive
    | Could not parse module unit_invalid_local_declaration_of_recursive from file unit_invalid_local_declaration_of_recursive.tla
    3002:1 Parsing or semantic analysis failed.
---*)
