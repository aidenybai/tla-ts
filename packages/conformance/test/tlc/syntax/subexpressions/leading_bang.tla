(*---
description: A bang cannot begin an expression.
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE leading_bang ----
Op == !1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Expression or Instance"
    | Encountered "!" at line 8, column 7 and token "==" 
    | Residual stack trace follows:
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file leading_bang
    | In module leading_bang
    | Could not parse module leading_bang from file leading_bang.tla
    | *** Errors: 1
    | In module leading_bang
    | Could not parse module leading_bang from file leading_bang.tla
    3002:1 Parsing or semantic analysis failed.
---*)
