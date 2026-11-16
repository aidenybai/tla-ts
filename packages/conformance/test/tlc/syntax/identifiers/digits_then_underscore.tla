(*---
description: Digits and underscores with no letter are not a name.
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE digits_then_underscore ----
1_ == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "1" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file digits_then_underscore
    | In module digits_then_underscore
    | Could not parse module digits_then_underscore from file digits_then_underscore.tla
    | *** Errors: 1
    | In module digits_then_underscore
    | Could not parse module digits_then_underscore from file digits_then_underscore.tla
    3002:1 Parsing or semantic analysis failed.
---*)
