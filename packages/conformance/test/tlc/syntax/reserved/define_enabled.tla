(*---
description: "ENABLED is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_enabled ----
ENABLED == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "----"
    | Encountered "Beginning of definition" at line 7, column 28 and token "define_enabled" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_enabled
    | In module define_enabled
    | Could not parse module define_enabled from file define_enabled.tla
    | *** Errors: 1
    | In module define_enabled
    | Could not parse module define_enabled from file define_enabled.tla
    3002:1 Parsing or semantic analysis failed.
---*)
