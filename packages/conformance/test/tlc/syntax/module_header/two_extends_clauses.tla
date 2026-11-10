(*---
description: Only one EXTENDS clause is allowed.
ref: "tla2sany/parser/TLAplusParser.java#Extends"
features: [module_header]
outcome: parse-error
---*)
---- MODULE two_extends_clauses ----
EXTENDS Naturals
EXTENDS Sequences
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "EXTENDS" at line 9, column 1 and token "Naturals" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file two_extends_clauses
    | In module two_extends_clauses
    | Could not parse module two_extends_clauses from file two_extends_clauses.tla
    | *** Errors: 1
    | In module two_extends_clauses
    | Could not parse module two_extends_clauses from file two_extends_clauses.tla
    3002:1 Parsing or semantic analysis failed.
---*)
