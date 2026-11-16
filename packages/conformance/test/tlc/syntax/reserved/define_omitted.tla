(*---
description: "OMITTED is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_omitted ----
OMITTED == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "Beginning of definition OMITTED" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_omitted
    | In module define_omitted
    | Could not parse module define_omitted from file define_omitted.tla
    | *** Errors: 1
    | In module define_omitted
    | Could not parse module define_omitted from file define_omitted.tla
    3002:1 Parsing or semantic analysis failed.
---*)
