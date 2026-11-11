(*---
description: "UNION is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_union ----
UNION == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "----"
    | Encountered "Beginning of definition" at line 7, column 26 and token "define_union" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_union
    | In module define_union
    | Could not parse module define_union from file define_union.tla
    | *** Errors: 1
    | In module define_union
    | Could not parse module define_union from file define_union.tla
    3002:1 Parsing or semantic analysis failed.
---*)
