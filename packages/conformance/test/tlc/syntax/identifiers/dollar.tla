(*---
description: "$ is an operator, not an identifier character."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE dollar ----
a$ == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "==" at line 8, column 4 and token "$" 
    | Residual stack trace follows:
    | Infix LHS starting at line 8, column 1.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file dollar
    | In module dollar
    | Could not parse module dollar from file dollar.tla
    | *** Errors: 1
    | In module dollar
    | Could not parse module dollar from file dollar.tla
    3002:1 Parsing or semantic analysis failed.
---*)
