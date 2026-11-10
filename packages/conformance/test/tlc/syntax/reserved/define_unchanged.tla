(*---
description: "UNCHANGED is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_unchanged ----
UNCHANGED == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "----"
    | Encountered "Beginning of definition" at line 7, column 30 and token "define_unchanged" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_unchanged
    | In module define_unchanged
    | Could not parse module define_unchanged from file define_unchanged.tla
    | *** Errors: 1
    | In module define_unchanged
    | Could not parse module define_unchanged from file define_unchanged.tla
    3002:1 Parsing or semantic analysis failed.
---*)
