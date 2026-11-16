(*---
description: "A bare underscore is the placeholder token, not a name."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE only_underscore ----
_ == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "Beginning of definition _" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file only_underscore
    | In module only_underscore
    | Could not parse module only_underscore from file only_underscore.tla
    | *** Errors: 1
    | In module only_underscore
    | Could not parse module only_underscore from file only_underscore.tla
    3002:1 Parsing or semantic analysis failed.
---*)
