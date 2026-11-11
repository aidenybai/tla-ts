(*---
description: EXTENDS must come first in the body.
ref: "tla2sany/parser/TLAplusParser.java#Extends"
features: [module_header]
outcome: parse-error
---*)
---- MODULE extends_after_definition ----
A == 1
EXTENDS Naturals
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "EXTENDS" at line 9, column 1 and token "1" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file extends_after_definition
    | In module extends_after_definition
    | Could not parse module extends_after_definition from file extends_after_definition.tla
    | *** Errors: 1
    | In module extends_after_definition
    | Could not parse module extends_after_definition from file extends_after_definition.tla
    3002:1 Parsing or semantic analysis failed.
---*)
