(*---
description: Underscores alone are not a name.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE only_underscores ----
__ == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "_" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file only_underscores
    | In module only_underscores
    | Could not parse module only_underscores from file only_underscores.tla
    | *** Errors: 1
    | In module only_underscores
    | Could not parse module only_underscores from file only_underscores.tla
    3002:1 Parsing or semantic analysis failed.
---*)
