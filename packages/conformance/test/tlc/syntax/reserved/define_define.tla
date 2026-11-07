(*---
description: "DEFINE is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_define ----
DEFINE == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "Beginning of definition DEFINE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_define
    | In module define_define
    | Could not parse module define_define from file define_define.tla
    | *** Errors: 1
    | In module define_define
    | Could not parse module define_define from file define_define.tla
    3002:1 Parsing or semantic analysis failed.
---*)
