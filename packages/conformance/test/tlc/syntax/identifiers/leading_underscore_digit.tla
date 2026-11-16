(*---
description: "_1 lexes as an underscore and a number, not as a name."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE leading_underscore_digit ----
_1 == 1
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
    | Fatal errors while parsing TLA+ spec in file leading_underscore_digit
    | In module leading_underscore_digit
    | Could not parse module leading_underscore_digit from file leading_underscore_digit.tla
    | *** Errors: 1
    | In module leading_underscore_digit
    | Could not parse module leading_underscore_digit from file leading_underscore_digit.tla
    3002:1 Parsing or semantic analysis failed.
---*)
