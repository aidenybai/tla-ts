(*---
description: "RECURSIVE takes underscores, not parameter names."
ref: "tla2sany/parser/TLAplusParser.java#Recursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE declaration_with_names ----
RECURSIVE F(x)
F(x) == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "( x" at line 8, column 12 and token "F" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file declaration_with_names
    | In module declaration_with_names
    | Could not parse module declaration_with_names from file declaration_with_names.tla
    | *** Errors: 1
    | In module declaration_with_names
    | Could not parse module declaration_with_names from file declaration_with_names.tla
    3002:1 Parsing or semantic analysis failed.
---*)
